import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  price: number;
  totalTickets: number;
  availableTickets: number;
  creator: mongoose.Types.ObjectId;
  reminderDaysBefore: number[]; // e.g., [1, 7] for 1 day and 7 days before
  imageUrl?: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  totalTickets: { type: Number, required: true, min: 1 },
  availableTickets: { type: Number, required: true },
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reminderDaysBefore: { type: [Number], default: [1] },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IEvent>("Event", EventSchema);
