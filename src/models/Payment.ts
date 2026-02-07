import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  user: Types.ObjectId;
  event: Types.ObjectId;
  ticket: Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  paystackReference: string;
  paystackAccessCode: string;
  paystackTransactionId?: string;
  paymentMethod: string;
  metadata: Record<string, any>;
  paidAt?: Date;
  refundedAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticket: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending",
    },
    paystackReference: {
      type: String,
      required: true,
      unique: true,
    },
    paystackAccessCode: {
      type: String,
      required: true,
    },
    paystackTransactionId: {
      type: String,
    },
    paymentMethod: {
      type: String,
      default: "card",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    paidAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ event: 1, status: 1 });
paymentSchema.index({ paystackReference: 1 }, { unique: true });
paymentSchema.index({ status: 1, createdAt: 1 });

const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
export default Payment;
