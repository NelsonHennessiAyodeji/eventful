import { Request, Response } from "express";
import { body, validationResult, param } from "express-validator";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import { QRCodeService } from "../services/qrCode.service";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../middlewares/auth";

export class EventController {
  static async createEvent(req: AuthRequest, res: Response) {
    try {
      // Validation
      await body("title").notEmpty().trim().run(req);
      await body("description").notEmpty().trim().run(req);
      await body("category")
        .isIn([
          "concert",
          "theater",
          "sports",
          "cultural",
          "workshop",
          "conference",
          "other",
        ])
        .run(req);
      await body("startDate").isISO8601().run(req);
      await body("endDate").isISO8601().run(req);
      await body("venue.name").notEmpty().trim().run(req);
      await body("venue.address").notEmpty().trim().run(req);
      await body("venue.city").notEmpty().trim().run(req);
      await body("venue.country").notEmpty().trim().run(req);
      await body("tickets.total").isInt({ min: 1 }).run(req);
      await body("tickets.price").isFloat({ min: 0 }).run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const eventData = req.body;

      // Create event
      const event = new Event({
        ...eventData,
        organizer: req.user._id,
        "tickets.sold": 0,
        isPublished: eventData.isPublished || false,
      });

      await event.save();

      // Send notification to organizer
      await NotificationService.createNotification(
        req.user._id,
        "event_updated",
        "Event Created Successfully",
        `Your event "${event.title}" has been created successfully.`,
        {
          eventId: event._id,
          eventTitle: event.title,
          eventDate: event.startDate,
          actionUrl: `${process.env.FRONTEND_URL}/events/${event._id}/edit`,
        },
        event._id
      );

      res.status(201).json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getEvents(req: Request, res: Response) {
    try {
      const {
        category,
        city,
        startDate,
        endDate,
        page = 1,
        limit = 10,
        search,
      } = req.query;

      const query: any = { isPublished: true };

      if (category) query.category = category;
      if (city) query["venue.city"] = city;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { "venue.name": { $regex: search, $options: "i" } },
        ];
      }

      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = new Date(startDate as string);
        if (endDate) query.startDate.$lte = new Date(endDate as string);
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const events = await Event.find(query)
        .populate("organizer", "name email avatar")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit as string));

      const total = await Event.countDocuments(query);

      res.json({
        events,
        pagination: {
          total,
          page: parseInt(page as string),
          pages: Math.ceil(total / parseInt(limit as string)),
          limit: parseInt(limit as string),
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getEventById(req: Request, res: Response) {
    try {
      await param("id").isMongoId().run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const event = await Event.findById(req.params.id).populate(
        "organizer",
        "name email avatar organization"
      );

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (
        !event.isPublished &&
        req.user?._id.toString() !== event.organizer._id.toString()
      ) {
        return res.status(403).json({ error: "Event not published" });
      }

      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyEvents(req: AuthRequest, res: Response) {
    try {
      const events = await Event.find({ organizer: req.user._id }).sort({
        createdAt: -1,
      });

      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateEvent(req: AuthRequest, res: Response) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check ownership
      if (event.organizer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const updates = req.body;

      // Don't allow updating tickets sold
      if (updates.tickets) {
        delete updates.tickets.sold;
        if (updates.tickets.types) {
          updates.tickets.types = updates.tickets.types.map((type: any) => ({
            ...type,
            sold:
              event.tickets.types.find((t) => t.name === type.name)?.sold || 0,
          }));
        }
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      );

      // Notify attendees about event updates
      const tickets = await Ticket.find({
        event: event._id,
        paymentStatus: "paid",
      });

      for (const ticket of tickets) {
        await NotificationService.createNotification(
          ticket.user,
          "event_updated",
          "Event Updated",
          `The event "${event.title}" has been updated.`,
          {
            eventId: event._id,
            eventTitle: event.title,
            changes: Object.keys(updates),
            actionUrl: `${process.env.FRONTEND_URL}/events/${event._id}`,
          },
          event._id
        );
      }

      res.json(updatedEvent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check ownership
      if (event.organizer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Check if there are tickets sold
      if (event.tickets.sold > 0) {
        return res.status(400).json({
          error:
            "Cannot delete event with sold tickets. Please refund tickets first.",
        });
      }

      await Event.findByIdAndDelete(req.params.id);

      // Delete associated tickets
      await Ticket.deleteMany({ event: event._id });

      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getEventAttendees(req: AuthRequest, res: Response) {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check ownership
      if (event.organizer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const tickets = await Ticket.find({
        event: event._id,
        paymentStatus: "paid",
      })
        .populate("user", "name email phone")
        .sort({ purchaseDate: -1 });

      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
