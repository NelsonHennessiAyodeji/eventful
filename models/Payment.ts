import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  event: mongoose.Types.ObjectId;
  attendee: mongoose.Types.ObjectId;
  amount: number;
  reference: string; // Paystack reference
  status: "pending" | "success" | "failed";
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  attendee: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  reference: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IPayment>("Payment", PaymentSchema);
