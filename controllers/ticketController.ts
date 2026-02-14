import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Ticket from "../models/Ticket";
import Event from "../models/Event";
import Payment from "../models/Payment";
import { generateQRCode } from "../services/qrCode";
import { successResponse, errorResponse } from "../utils/apiResponse";

// @desc    Purchase ticket (after successful payment)
// This would be called by webhook after payment verification
export const createTicket = async (paymentId: string) => {
  try {
    const payment = await Payment.findById(paymentId).populate(
      "event attendee"
    );
    if (!payment) throw new Error("Payment not found");
    const event = payment.event as any;
    // Generate unique data for QR (e.g., ticket id + random)
    const qrData = JSON.stringify({
      ticketId: payment._id,
      event: event._id,
      attendee: payment.attendee._id,
    });
    const qrCode = await generateQRCode(qrData);
    const ticket = await Ticket.create({
      event: event._id,
      attendee: payment.attendee._id,
      payment: payment._id,
      qrCode,
    });
    // Decrease available tickets
    event.availableTickets -= 1;
    await event.save();
    return ticket;
  } catch (error) {
    throw error;
  }
};

// @desc    Get user's tickets
export const getMyTickets = async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await Ticket.find({ attendee: req.user?.id }).populate(
      "event"
    );
    successResponse(res, tickets);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Verify ticket (scan QR) - creator only
export const scanTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.body;
    const ticket = await Ticket.findById(ticketId).populate("event");
    if (!ticket) return errorResponse(res, "Ticket not found", 404);
    const event = ticket.event as any;
    if (event.creator.toString() !== req.user?.id) {
      return errorResponse(res, "Not authorized to scan this ticket", 403);
    }
    if (ticket.scanned) {
      return errorResponse(res, "Ticket already scanned", 400);
    }
    ticket.scanned = true;
    await ticket.save();
    successResponse(res, { scanned: true }, "Ticket verified");
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};
