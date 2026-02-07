import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import Payment from "../models/Payment";
import Ticket from "../models/Ticket";
import Event from "../models/Event";
import { PaystackService } from "../services/paystack.service";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth";

export class PaymentController {
  static async initializePayment(req: AuthRequest, res: Response) {
    try {
      // Validation
      await body("eventId").isMongoId().run(req);
      await body("ticketType").optional().isString().trim().run(req);
      await body("quantity").optional().isInt({ min: 1, max: 10 }).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        eventId,
        ticketType = "General Admission",
        quantity = 1,
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

      // Calculate amount
      const selectedTicketType = event.tickets.types.find(
        (t) => t.name === ticketType
      );
      const price = selectedTicketType?.price || event.tickets.price;
      const amount = price * quantity;

      // Generate a unique reference
      const reference = `EVT-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Initialize payment with Paystack
      const paymentData = await PaystackService.initializeTransaction(
        req.user.email,
        amount,
        reference,
        {
          eventId,
          userId: req.user._id,
          ticketType,
          quantity,
        }
      );

      // Create a payment record (pending)
      const payment = new Payment({
        user: req.user._id,
        event: eventId,
        amount,
        currency: event.tickets.currency,
        paystackReference: reference,
        paystackAccessCode: paymentData.data.access_code,
        metadata: {
          ticketType,
          quantity,
        },
      });

      await payment.save();

      res.json({
        authorizationUrl: paymentData.data.authorization_url,
        reference: payment.paystackReference,
        amount: payment.amount,
        currency: payment.currency,
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

      // Verify with Paystack
      const verification = await PaystackService.verifyTransaction(
        reference as string
      );

      if (verification.data.status === "success") {
        // Update payment record
        const payment = await Payment.findOne({ paystackReference: reference });
        if (!payment) {
          return res.status(404).json({ error: "Payment not found" });
        }

        payment.status = "successful";
        payment.paystackTransactionId = verification.data.id;
        payment.paidAt = new Date();
        await payment.save();

        // Create ticket(s)
        const event = await Event.findById(payment.event);
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }

        const ticketType = payment.metadata.ticketType;
        const quantity = payment.metadata.quantity;

        // Update event ticket sold count
        event.tickets.sold += quantity;
        await event.save();

        // Create tickets
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
          // Generate QR code (we'll use a placeholder for now, but in reality, use the QRCodeService)
          const ticket = new Ticket({
            event: payment.event,
            user: payment.user,
            ticketType,
            price: payment.amount / quantity,
            currency: payment.currency,
            qrCode: `QR_CODE_PLACEHOLDER_${Date.now()}_${i}`,
            paymentStatus: "paid",
            paymentReference: payment.paystackReference,
            metadata: {
              ...payment.metadata,
              sequence: i + 1,
            },
          });
          await ticket.save();
          tickets.push(ticket);

          // Send notification to user
          await NotificationService.createNotification(
            payment.user,
            "ticket_purchased",
            "Ticket Purchase Successful",
            `Your ticket for ${event.title} has been purchased successfully.`,
            {
              eventId: event._id,
              eventTitle: event.title,
              ticketId: ticket._id,
              actionUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`,
            },
            event._id
          );
        }

        // Notify organizer
        await NotificationService.createNotification(
          event.organizer,
          "ticket_purchased",
          "New Ticket Sale",
          `A new ticket has been sold for your event ${event.title}.`,
          {
            eventId: event._id,
            eventTitle: event.title,
            ticketCount: quantity,
            actionUrl: `${process.env.FRONTEND_URL}/events/${event._id}/analytics`,
          },
          event._id
        );

        res.json({
          success: true,
          message: "Payment verified and tickets issued",
          tickets,
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

  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["x-paystack-signature"] as string;
      const isValid = await PaystackService.verifyWebhookSignature(
        req.body,
        signature
      );

      if (!isValid) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      await PaystackService.handleWebhook(req.body);

      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
