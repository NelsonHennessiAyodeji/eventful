import cron from "node-cron";
import nodemailer from "nodemailer";
import { Types } from "mongoose";
import Notification from "../models/Notification";
import Event from "../models/Event";
import User, { IUser } from "../models/User";
import Ticket from "../models/Ticket";
import logger from "../utils/logger";

// Define interface for populated user
interface IPopulatedUser {
  _id: Types.ObjectId;
  email: string;
  name?: string;
  notifications?: {
    email: boolean;
    push: boolean;
  };
}

export class NotificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  static async sendEmailNotification(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Eventful" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: text || subject,
        html,
      });

      logger.info(`Email sent to ${to}`);
    } catch (error) {
      logger.error("Failed to send email:", error);
      throw new Error("Failed to send email notification");
    }
  }

  static async createNotification(
    userId: Types.ObjectId,
    type: string,
    title: string,
    message: string,
    data: any = {},
    eventId?: Types.ObjectId,
    scheduledFor?: Date
  ): Promise<void> {
    try {
      const notification = new Notification({
        user: userId,
        event: eventId,
        type,
        title,
        message,
        data,
        scheduledFor,
        sentAt: scheduledFor ? undefined : new Date(),
      });

      await notification.save();

      // Send immediate email if not scheduled
      if (!scheduledFor) {
        const user = await User.findById(userId);
        if (user?.notifications?.email) {
          await this.sendEventNotificationEmail(
            user.email,
            title,
            message,
            data
          );
        }
      }
    } catch (error) {
      logger.error("Failed to create notification:", error);
    }
  }

  private static async sendEventNotificationEmail(
    email: string,
    title: string,
    message: string,
    data: any
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
              ${
                data.eventTitle
                  ? `<p><strong>Event:</strong> ${data.eventTitle}</p>`
                  : ""
              }
              ${
                data.eventDate
                  ? `<p><strong>Date:</strong> ${new Date(
                      data.eventDate
                    ).toLocaleDateString()}</p>`
                  : ""
              }
              ${
                data.eventTime
                  ? `<p><strong>Time:</strong> ${data.eventTime}</p>`
                  : ""
              }
              ${
                data.venue ? `<p><strong>Venue:</strong> ${data.venue}</p>` : ""
              }
              ${
                data.ticketId
                  ? `<p><strong>Ticket ID:</strong> ${data.ticketId}</p>`
                  : ""
              }
              ${
                data.actionUrl
                  ? `<a href="${data.actionUrl}" class="button">View Details</a>`
                  : ""
              }
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Eventful. All rights reserved.</p>
              <p><a href="${
                process.env.FRONTEND_URL
              }/notifications">Manage notifications</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.sendEmailNotification(email, title, html);
  }

  static async scheduleEventReminders(): Promise<void> {
    // Schedule to run every hour
    cron.schedule("0 * * * *", async () => {
      try {
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const oneWeekFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        );

        // Find upcoming events
        const upcomingEvents = await Event.find({
          startDate: { $gt: now, $lte: oneWeekFromNow },
          isPublished: true,
        }).populate<{ organizer: IUser }>(
          "organizer",
          "email name notifications"
        );

        for (const event of upcomingEvents) {
          // Calculate hours until event
          const hoursUntilEvent = Math.floor(
            (event.startDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          );

          // Send reminders based on predefined intervals (24h, 2h before event)
          const reminderIntervals = [24, 2];
          for (const interval of reminderIntervals) {
            if (hoursUntilEvent <= interval && hoursUntilEvent > interval - 1) {
              // Send reminder to organizer
              if (event.reminderSettings?.creatorReminder?.enabled) {
                await this.sendEventReminderToOrganizer(event);
              }

              // Send reminders to attendees
              await this.sendEventRemindersToAttendees(event, interval);
              break;
            }
          }
        }
      } catch (error) {
        logger.error("Error in event reminder scheduler:", error);
      }
    });

    logger.info("Event reminder scheduler started");
  }

  private static async sendEventReminderToOrganizer(event: any): Promise<void> {
    const organizer = event.organizer as IUser;

    if (!organizer?.notifications?.email) {
      return;
    }

    const reminderData = {
      eventTitle: event.title,
      eventDate: event.startDate,
      eventTime: event.startDate.toLocaleTimeString(),
      venue: event.venue.name,
      ticketsSold: event.tickets.sold,
      totalTickets: event.tickets.total,
      actionUrl: `${process.env.FRONTEND_URL}/events/${event._id}/analytics`,
    };

    await this.createNotification(
      organizer._id,
      "event_reminder",
      `Event Reminder: ${event.title}`,
      `Your event "${event.title}" is starting soon.`,
      reminderData,
      event._id
    );
  }

  private static async sendEventRemindersToAttendees(
    event: any,
    hoursBefore: number
  ): Promise<void> {
    // Define the populated ticket interface
    interface IPopulatedTicket {
      _id: Types.ObjectId;
      user: IPopulatedUser;
      qrCode: string;
      paymentStatus: string;
    }

    // Get tickets with populated user data including notifications
    const tickets = await Ticket.find({
      event: event._id,
      paymentStatus: "paid",
    }).populate<{ user: IPopulatedUser }>("user", "email notifications");

    for (const ticket of tickets) {
      const user = ticket.user as IPopulatedUser;

      // Check if user wants email notifications
      if (user?.notifications?.email) {
        const reminderData = {
          eventTitle: event.title,
          eventDate: event.startDate,
          eventTime: event.startDate.toLocaleTimeString(),
          venue: event.venue.name,
          ticketId: ticket._id,
          qrCode: ticket.qrCode,
          actionUrl: `${process.env.FRONTEND_URL}/tickets/${ticket._id}`,
        };

        await this.createNotification(
          user._id,
          "event_reminder",
          `Event Reminder: ${event.title}`,
          `The event "${event.title}" starts in ${hoursBefore} hours.`,
          reminderData,
          event._id
        );
      }
    }
  }

  // Optional: Add method for sending push notifications
  static async sendPushNotification(
    userId: Types.ObjectId,
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    try {
      // This is a placeholder for actual push notification implementation
      // You would integrate with Firebase Cloud Messaging, OneSignal, etc.
      logger.info(`Push notification sent to user ${userId}: ${title}`);
    } catch (error) {
      logger.error("Failed to send push notification:", error);
    }
  }

  // Add method for sending bulk notifications
  static async sendBulkNotifications(
    userIds: Types.ObjectId[],
    type: string,
    title: string,
    message: string,
    data: any = {}
  ): Promise<void> {
    try {
      const notifications = userIds.map((userId) => ({
        user: userId,
        type,
        title,
        message,
        data,
        sentAt: new Date(),
      }));

      await Notification.insertMany(notifications);

      logger.info(`Bulk notifications sent to ${userIds.length} users`);
    } catch (error) {
      logger.error("Failed to send bulk notifications:", error);
    }
  }

  // Add method for clearing old notifications
  static async cleanupOldNotifications(days: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await Notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true,
      });

      logger.info(`Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      logger.error("Failed to cleanup old notifications:", error);
    }
  }
}
