import mongoose, { Schema, Document, Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  event?: Types.ObjectId;
  type:
    | "event_reminder"
    | "ticket_purchased"
    | "event_updated"
    | "payment_success"
    | "system";
  title: string;
  message: string;
  data: Record<string, any>;
  isRead: boolean;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
    },
    type: {
      type: String,
      enum: [
        "event_reminder",
        "ticket_purchased",
        "event_updated",
        "payment_success",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    scheduledFor: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, sentAt: 1 });
notificationSchema.index({ event: 1, type: 1 });

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);
export default Notification;
