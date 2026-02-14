import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Payment from "../models/Payment";
import Event from "../models/Event";
import { initializeTransaction, verifyTransaction } from "../services/paystack";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { v4 as uuidv4 } from "uuid";

// @desc    Initialize payment for an event
export const initializePayment = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return errorResponse(res, "Event not found", 404);
    if (event.availableTickets < 1) {
      return errorResponse(res, "No tickets available", 400);
    }
    const reference = `EVT-${uuidv4()}`;
    const payment = await Payment.create({
      event: eventId,
      attendee: req.user?.id,
      amount: event.price,
      reference,
      status: "pending",
    });
    const response = await initializeTransaction(
      req.user!.email,
      event.price,
      reference
    );
    if (response.status) {
      successResponse(
        res,
        { authorization_url: response.data.authorization_url, reference },
        "Payment initialized"
      );
    } else {
      errorResponse(res, "Paystack initialization failed", 500);
    }
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Verify payment (can be called by frontend after redirect)
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ reference });
    if (!payment) return errorResponse(res, "Payment not found", 404);
    const verification = await verifyTransaction(reference);
    if (verification.data.status === "success") {
      payment.status = "success";
      await payment.save();
      // Create ticket
      const { createTicket } = await import("./ticketController");
      await createTicket(payment.id);
      successResponse(res, { payment }, "Payment verified successfully");
    } else {
      payment.status = "failed";
      await payment.save();
      errorResponse(res, "Payment verification failed", 400);
    }
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Get payments for creator's events
export const getEventPayments = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find({ creator: req.user?.id }).select("_id");
    const eventIds = events.map((e) => e._id);
    const payments = await Payment.find({ event: { $in: eventIds } })
      .populate("event", "title")
      .populate("attendee", "name email");
    successResponse(res, payments);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};
