import { Request, Response } from "express";
import Notification from "../models/Notification";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import User from "../models/User";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth";

export class NotificationController {
  static async getUserNotifications(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const query: any = { user: req.user._id };
      if (unreadOnly === "true") {
        query.isRead = false;
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const notifications = await Notification.find(query)
        .populate("event", "title startDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        user: req.user._id,
        isRead: false,
      });

      res.json({
        notifications,
        pagination: {
          total,
          page: parseInt(page as string),
          pages: Math.ceil(total / parseInt(limit as string)),
          limit: parseInt(limit as string),
        },
        unreadCount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, user: req.user._id },
        { isRead: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }

      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await Notification.updateMany(
        { user: req.user._id, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async setReminder(req: AuthRequest, res: Response) {
    try {
      const { eventId, intervals } = req.body;

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if user has a ticket for the event
      const ticket = await Ticket.findOne({
        event: eventId,
        user: req.user._id,
        paymentStatus: "paid",
      });

      if (!ticket && req.user.role !== "creator") {
        return res
          .status(400)
          .json({ error: "You need a ticket to set reminders for this event" });
      }

      // Validate intervals (in hours)
      const validIntervals = Array.isArray(intervals)
        ? intervals.filter(
            (interval: number) => interval > 0 && interval <= 168
          ) // Max 1 week
        : [24, 2]; // Default reminders

      // Schedule notifications
      for (const interval of validIntervals) {
        const reminderTime = new Date(
          event.startDate.getTime() - interval * 60 * 60 * 1000
        );

        if (reminderTime > new Date()) {
          await NotificationService.createNotification(
            req.user._id,
            "event_reminder",
            `Event Reminder: ${event.title}`,
            `The event "${event.title}" starts in ${interval} hours.`,
            {
              eventId: event._id,
              eventTitle: event.title,
              eventDate: event.startDate,
              venue: event.venue.name,
              interval,
            },
            event._id,
            reminderTime
          );
        }
      }

      res.json({
        message: "Reminders set successfully",
        intervals: validIntervals,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateNotificationSettings(req: AuthRequest, res: Response) {
    try {
      const { email, push } = req.body;

      const updates: any = {};
      if (email !== undefined) updates["notifications.email"] = email;
      if (push !== undefined) updates["notifications.push"] = push;

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true }
      ).select("-password");

      res.json({
        message: "Notification settings updated",
        notifications: user?.notifications,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
