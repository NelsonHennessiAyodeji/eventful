import mongoose, { Document, Schema } from "mongoose";

export interface IReminder extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  remindAt: Date; // When to send the reminder
  sent: boolean;
  createdAt: Date;
}

const ReminderSchema = new Schema<IReminder>({
  event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  remindAt: { type: Date, required: true },
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IReminder>("Reminder", ReminderSchema);
