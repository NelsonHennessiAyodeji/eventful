"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventAttendees = exports.getMyEvents = exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getEvents = exports.createEvent = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const Ticket_1 = __importDefault(require("../models/Ticket"));
const apiResponse_1 = require("../utils/apiResponse");
const reminderScheduler_1 = require("../services/reminderScheduler");
// @desc    Create event (creator only)
const createEvent = async (req, res) => {
    try {
        if (req.user?.role !== "creator") {
            return (0, apiResponse_1.errorResponse)(res, "Only creators can create events", 403);
        }
        const { title, description, date, location, price, totalTickets, reminderDaysBefore, } = req.body;
        const event = await Event_1.default.create({
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
        await (0, reminderScheduler_1.createEventReminders)(event.id, req.user.id, date, event.reminderDaysBefore);
        (0, apiResponse_1.successResponse)(res, event, "Event created", 201);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.createEvent = createEvent;
// @desc    Get all events (public)
const getEvents = async (req, res) => {
    try {
        const events = await Event_1.default.find().populate("creator", "name email");
        (0, apiResponse_1.successResponse)(res, events);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getEvents = getEvents;
// @desc    Get single event
const getEventById = async (req, res) => {
    try {
        const event = await Event_1.default.findById(req.params.id).populate("creator", "name email");
        if (!event) {
            return (0, apiResponse_1.errorResponse)(res, "Event not found", 404);
        }
        (0, apiResponse_1.successResponse)(res, event);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getEventById = getEventById;
// @desc    Update event (creator only)
const updateEvent = async (req, res) => {
    try {
        const event = await Event_1.default.findById(req.params.id);
        if (!event)
            return (0, apiResponse_1.errorResponse)(res, "Event not found", 404);
        if (event.creator.toString() !== req.user?.id) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 403);
        }
        const updated = await Event_1.default.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        (0, apiResponse_1.successResponse)(res, updated, "Event updated");
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.updateEvent = updateEvent;
// @desc    Delete event (creator only)
const deleteEvent = async (req, res) => {
    try {
        const event = await Event_1.default.findById(req.params.id);
        if (!event)
            return (0, apiResponse_1.errorResponse)(res, "Event not found", 404);
        if (event.creator.toString() !== req.user?.id) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 403);
        }
        await event.deleteOne();
        (0, apiResponse_1.successResponse)(res, null, "Event deleted");
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.deleteEvent = deleteEvent;
// @desc    Get events created by logged-in creator
const getMyEvents = async (req, res) => {
    try {
        const events = await Event_1.default.find({ creator: req.user?.id });
        (0, apiResponse_1.successResponse)(res, events);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getMyEvents = getMyEvents;
// @desc    Get attendees for a specific event (creator only)
const getEventAttendees = async (req, res) => {
    try {
        const event = await Event_1.default.findById(req.params.id);
        if (!event)
            return (0, apiResponse_1.errorResponse)(res, "Event not found", 404);
        if (event.creator.toString() !== req.user?.id) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 403);
        }
        const tickets = await Ticket_1.default.find({ event: event.id }).populate("attendee", "name email");
        (0, apiResponse_1.successResponse)(res, tickets);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getEventAttendees = getEventAttendees;
