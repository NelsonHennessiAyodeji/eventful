import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import { successResponse, errorResponse } from "../utils/apiResponse";
import { createEventReminders } from "../services/reminderScheduler";

// @desc    Create event (creator only)
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "creator") {
      return errorResponse(res, "Only creators can create events", 403);
    }
    const {
      title,
      description,
      date,
      location,
      price,
      totalTickets,
      reminderDaysBefore,
    } = req.body;
    const event = await Event.create({
      title,
      description,
      date,
      location,
      price,
      totalTickets,
      availableTickets: totalTickets,
      creator: req.user.id,
      reminderDaysBefore: reminderDaysBefore || [1],
    });
    // Create reminders for creator
    await createEventReminders(
      event.id,
      req.user.id,
      date,
      event.reminderDaysBefore
    );
    successResponse(res, event, "Event created", 201);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Get all events (public)
export const getEvents = async (req: Request, res: Response) => {
  try {
    const events = await Event.find().populate("creator", "name email");
    successResponse(res, events);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Get single event
export const getEventById = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "creator",
      "name email"
    );
    if (!event) {
      return errorResponse(res, "Event not found", 404);
    }
    successResponse(res, event);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Update event (creator only)
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, "Event not found", 404);
    if (event.creator.toString() !== req.user?.id) {
      return errorResponse(res, "Not authorized", 403);
    }
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    successResponse(res, updated, "Event updated");
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Delete event (creator only)
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, "Event not found", 404);
    if (event.creator.toString() !== req.user?.id) {
      return errorResponse(res, "Not authorized", 403);
    }
    await event.deleteOne();
    successResponse(res, null, "Event deleted");
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Get events created by logged-in creator
export const getMyEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find({ creator: req.user?.id });
    successResponse(res, events);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Get attendees for a specific event (creator only)
export const getEventAttendees = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, "Event not found", 404);
    if (event.creator.toString() !== req.user?.id) {
      return errorResponse(res, "Not authorized", 403);
    }
    const tickets = await Ticket.find({ event: event.id }).populate(
      "attendee",
      "name email"
    );
    successResponse(res, tickets);
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};
