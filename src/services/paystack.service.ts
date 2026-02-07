import axios from "axios";
import Payment from "../models/Payment";

export class PaystackService {
  private static readonly baseURL = "https://api.paystack.co";
  private static readonly secretKey = process.env.PAYSTACK_SECRET_KEY!;

  static async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata: any = {}
  ) {
    try {
      const response = await axios.post(
        `${this.baseURL}/transaction/initialize`,
        {
          email,
          amount: amount * 100, // Paystack expects amount in kobo
          reference,
          metadata,
          callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Paystack initialization error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to initialize payment");
    }
  }

  static async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Paystack verification error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to verify payment");
    }
  }

  static async verifyWebhookSignature(
    payload: any,
    signature: string
  ): Promise<boolean> {
    const crypto = await import("crypto");
    const hash = crypto
      .createHmac("sha512", this.secretKey)
      .update(JSON.stringify(payload))
      .digest("hex");

    return hash === signature;
  }

  static async handleWebhook(event: any): Promise<void> {
    const { event: eventType, data } = event;

    switch (eventType) {
      case "charge.success":
        await this.handleSuccessfulCharge(data);
        break;
      case "charge.failed":
        await this.handleFailedCharge(data);
        break;
      case "transfer.success":
        await this.handleSuccessfulTransfer(data);
        break;
    }
  }

  private static async handleSuccessfulCharge(data: any): Promise<void> {
    const payment = await Payment.findOne({
      paystackReference: data.reference,
    });

    if (payment) {
      payment.status = "successful";
      payment.paystackTransactionId = data.id;
      payment.paidAt = new Date();
      payment.metadata = { ...payment.metadata, ...data };
      await payment.save();
    }
  }

  private static async handleFailedCharge(data: any): Promise<void> {
    const payment = await Payment.findOne({
      paystackReference: data.reference,
    });

    if (payment) {
      payment.status = "failed";
      payment.metadata = { ...payment.metadata, ...data };
      await payment.save();
    }
  }

  private static async handleSuccessfulTransfer(data: any): Promise<void> {
    // Handle successful transfers to organizers
    console.log("Transfer successful:", data);
  }
}
