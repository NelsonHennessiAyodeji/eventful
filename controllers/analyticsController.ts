import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import Payment from "../models/Payment";
import { successResponse, errorResponse } from "../utils/apiResponse";

// @desc    Get overall analytics for creator
export const getOverallAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find({ creator: req.user?.id });
    const eventIds = events.map((e) => e._id);
    const totalAttendees = await Ticket.countDocuments({
      event: { $in: eventIds },
    });
    const scannedCount = await Ticket.countDocuments({
      event: { $in: eventIds },
      scanned: true,
    });
    const totalTicketsSold = await Payment.countDocuments({
      event: { $in: eventIds },
      status: "success",
    });
    const totalRevenue = await Payment.aggregate([
      { $match: { event: { $in: eventIds }, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    successResponse(res, {
      totalAttendees,
      scannedCount,
      totalTicketsSold,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};

// @desc    Get analytics for a specific event
export const getEventAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, "Event not found", 404);
    if (event.creator.toString() !== req.user?.id) {
      return errorResponse(res, "Not authorized", 403);
    }
    const totalAttendees = await Ticket.countDocuments({ event: event._id });
    const scannedCount = await Ticket.countDocuments({
      event: event._id,
      scanned: true,
    });
    const ticketsSold = await Payment.countDocuments({
      event: event._id,
      status: "success",
    });
    const revenue = await Payment.aggregate([
      { $match: { event: event._id, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    successResponse(res, {
      totalAttendees,
      scannedCount,
      ticketsSold,
      revenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    errorResponse(res, "Server error", 500);
  }
};
