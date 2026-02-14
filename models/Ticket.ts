import mongoose, { Document, Schema } from "mongoose";

export interface ITicket extends Document {
  event: mongoose.Types.ObjectId;
  attendee: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  qrCode: string; // URL or data URI
  scanned: boolean;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  attendee: { type: Schema.Types.ObjectId, ref: "User", required: true },
  payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
  qrCode: { type: String, required: true },
  scanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITicket>("Ticket", TicketSchema);
