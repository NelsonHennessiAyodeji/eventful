import { Request, Response } from "express";
import { body, validationResult, param } from "express-validator";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import Payment from "../models/Payment";
import { QRCodeService } from "../services/qrCode.service";
import { PaystackService } from "../services/paystack.service";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth";

export class TicketController {
  static async purchaseTicket(req: AuthRequest, res: Response) {
    try {
      // Validation
      await body("eventId").isMongoId().run(req);
      await body("ticketType").optional().isString().trim().run(req);
      await body("quantity").optional().isInt({ min: 1, max: 10 }).run(req);
      await body("metadata").optional().isObject().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        eventId,
        ticketType = "General Admission",
        quantity = 1,
        metadata = {},
      } = req.body;

      // Check event
      const event = await Event.findById(eventId);
      if (!event || !event.isPublished) {
        return res
          .status(404)
          .json({ error: "Event not found or not published" });
      }

      // Check ticket availability
      if (event.tickets.sold + quantity > event.tickets.total) {
        return res.status(400).json({ error: "Not enough tickets available" });
      }

      // Check ticket type availability
      const selectedTicketType = event.tickets.types.find(
        (t) => t.name === ticketType
      );
      if (
        selectedTicketType &&
        selectedTicketType.sold + quantity > selectedTicketType.quantity
      ) {
        return res
          .status(400)
          .json({ error: "Not enough tickets of this type available" });
      }

      const price = selectedTicketType?.price || event.tickets.price;
      const totalAmount = price * quantity;

      // Create tickets and payments
      const tickets = [];
      const payments = [];

      for (let i = 0; i < quantity; i++) {
        // Generate QR code
        const { qrCode, hash } = await QRCodeService.generateTicketQRCode(
          eventId,
          req.user._id.toString(),
          `${Date.now()}-${i}`
        );

        // Create ticket
        const ticket = new Ticket({
          event: eventId,
          user: req.user._id,
          ticketType,
          price,
          currency: event.tickets.currency,
          qrCode,
          paymentStatus: "pending",
          paymentReference: `TKT-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          metadata: {
            ...metadata,
            hash,
            sequence: i + 1,
            totalQuantity: quantity,
          },
        });

        await ticket.save();
        tickets.push(ticket);

        // Create payment
        const payment = new Payment({
          user: req.user._id,
          event: eventId,
          ticket: ticket._id,
          amount: price,
          currency: event.tickets.currency,
          status: "pending",
          paystackReference: `PAY-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          paystackAccessCode: `ACC-${Math.random().toString(36).substr(2, 12)}`,
          metadata: {
            ticketType,
            quantity: 1,
            totalQuantity: quantity,
            sequence: i + 1,
          },
        });

        await payment.save();
        payments.push(payment);
      }

      // Initialize payment with Paystack
      const paymentData = await PaystackService.initializeTransaction(
        req.user.email,
        totalAmount,
        payments[0].paystackReference,
        {
          tickets: tickets.map((t) => t._id),
          eventId,
          userId: req.user._id,
          custom_fields: [
            {
              display_name: "Event",
              variable_name: "event",
              value: event.title,
            },
            {
              display_name: "Tickets",
              variable_name: "tickets",
              value: quantity,
            },
          ],
        }
      );

      res.json({
        tickets,
        payment: {
          authorizationUrl: paymentData.data.authorization_url,
          accessCode: paymentData.data.access_code,
          reference: payments[0].paystackReference,
          amount: totalAmount,
          currency: event.tickets.currency,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async verifyPayment(req: Request, res: Response) {
    try {
      const { reference } = req.query;

      if (!reference) {
        return res.status(400).json({ error: "Payment reference required" });
      }

      const verification = await PaystackService.verifyTransaction(
        reference as string
      );

      if (verification.data.status === "success") {
        // Find payment
        const payment = await Payment.findOne({ paystackReference: reference });

        if (payment) {
          payment.status = "successful";
          payment.paystackTransactionId = verification.data.id;
          payment.paidAt = new Date();
          await payment.save();

          // Update ticket
          const ticket = await Ticket.findById(payment.ticket);
          if (ticket) {
            ticket.paymentStatus = "paid";
            await ticket.save();

            // Update event ticket count
            await Event.findByIdAndUpdate(ticket.event, {
              $inc: { "tickets.sold": 1 },
            });

            // Send notification
            await NotificationService.createNotification(
              ticket.user,
              "payment_success",
              "Ticket Purchase Successful",
              `Your ticket for the event has been purchased successfully.`,
              {
                eventId: ticket.event,
                ticketId: ticket._id,
                qrCode: ticket.qrCode,
                actionUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`,
              },
              ticket.event
            );
          }
        }

        res.json({
          success: true,
          message: "Payment verified successfully",
          data: verification.data,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment verification failed",
          data: verification.data,
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyTickets(req: AuthRequest, res: Response) {
    try {
      const tickets = await Ticket.find({ user: req.user._id })
        .populate("event", "title startDate endDate venue images")
        .sort({ purchaseDate: -1 });

      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTicketById(req: AuthRequest, res: Response) {
    try {
      const ticket = await Ticket.findById(req.params.id)
        .populate("event")
        .populate("user", "name email");

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check ownership or organizer access
      if (
        ticket.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== "creator"
      ) {
        return res.status(403).json({ error: "Not authorized" });
      }

      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async validateTicket(req: AuthRequest, res: Response) {
    try {
      const { qrCodeData } = req.body;

      if (!qrCodeData) {
        return res.status(400).json({ error: "QR code data required" });
      }

      // Parse QR code data
      let parsedData;
      try {
        parsedData = JSON.parse(qrCodeData);
      } catch {
        return res.status(400).json({ error: "Invalid QR code format" });
      }

      const { ticketId, hash } = parsedData;

      // Find ticket
      const ticket = await Ticket.findById(ticketId)
        .populate("event")
        .populate("user", "name email");

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check if user is organizer of the event
      if (ticket.event.organizer.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to validate this ticket" });
      }

      // Validate QR code
      const isValid = QRCodeService.validateQRCode(
        qrCodeData,
        ticket.metadata?.hash
      );

      if (!isValid) {
        return res.status(400).json({ error: "Invalid QR code" });
      }

      // Check if already scanned
      if (ticket.isScanned) {
        return res.status(400).json({
          error: "Ticket already scanned",
          ticket: {
            ...ticket.toObject(),
            scannedAt: ticket.scannedAt,
            scannedBy: ticket.scannedBy,
          },
        });
      }

      // Mark as scanned
      ticket.isScanned = true;
      ticket.scannedAt = new Date();
      ticket.scannedBy = req.user._id;
      await ticket.save();

      res.json({
        success: true,
        message: "Ticket validated successfully",
        ticket: {
          id: ticket._id,
          event: ticket.event.title,
          user: ticket.user.name,
          ticketType: ticket.ticketType,
          scannedAt: ticket.scannedAt,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
