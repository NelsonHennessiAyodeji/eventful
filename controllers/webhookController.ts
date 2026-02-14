import { Request, Response } from "express";
import Payment from "../models/Payment";
import { verifyTransaction } from "../services/paystack";
import { createTicket } from "./ticketController";

// Paystack webhook endpoint
export const paystackWebhook = async (req: Request, res: Response) => {
  const event = req.body;
  // Verify the signature (optional but recommended)
  if (event.event === "charge.success") {
    const reference = event.data.reference;
    try {
      const payment = await Payment.findOne({ reference });
      if (payment && payment.status === "pending") {
        payment.status = "success";
        await payment.save();
        await createTicket(payment.id);
      }
    } catch (error) {
      console.error("Webhook error:", error);
    }
  }
  res.sendStatus(200);
};
