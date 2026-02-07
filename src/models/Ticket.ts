import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITicket extends Document {
  event: Types.ObjectId;
  user: Types.ObjectId;
  ticketType: string;
  price: number;
  currency: string;
  qrCode: string;
  isScanned: boolean;
  scannedAt?: Date;
  scannedBy?: Types.ObjectId;
  purchaseDate: Date;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentReference: string;
  metadata: {
    seatNumber?: string;
    row?: string;
    section?: string;
  };
}

const ticketSchema = new Schema<ITicket>(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketType: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    isScanned: {
      type: Boolean,
      default: false,
    },
    scannedAt: {
      type: Date,
    },
    scannedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },
    metadata: {
      seatNumber: String,
      row: String,
      section: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ticketSchema.index({ event: 1, user: 1 });
ticketSchema.index({ qrCode: 1 }, { unique: true });
ticketSchema.index({ paymentReference: 1 }, { unique: true });
ticketSchema.index({ isScanned: 1, event: 1 });
ticketSchema.index({ user: 1, purchaseDate: -1 });

const Ticket = mongoose.model<ITicket>("Ticket", ticketSchema);
export default Ticket;
