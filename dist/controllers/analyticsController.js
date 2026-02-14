"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventAnalytics = exports.getOverallAnalytics = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const Ticket_1 = __importDefault(require("../models/Ticket"));
const Payment_1 = __importDefault(require("../models/Payment"));
const apiResponse_1 = require("../utils/apiResponse");
// @desc    Get overall analytics for creator
const getOverallAnalytics = async (req, res) => {
    try {
        const events = await Event_1.default.find({ creator: req.user?.id });
        const eventIds = events.map((e) => e._id);
        const totalAttendees = await Ticket_1.default.countDocuments({
            event: { $in: eventIds },
        });
        const scannedCount = await Ticket_1.default.countDocuments({
            event: { $in: eventIds },
            scanned: true,
        });
        const totalTicketsSold = await Payment_1.default.countDocuments({
            event: { $in: eventIds },
            status: "success",
        });
        const totalRevenue = await Payment_1.default.aggregate([
            { $match: { event: { $in: eventIds }, status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        (0, apiResponse_1.successResponse)(res, {
            totalAttendees,
            scannedCount,
            totalTicketsSold,
            totalRevenue: totalRevenue[0]?.total || 0,
        });
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getOverallAnalytics = getOverallAnalytics;
// @desc    Get analytics for a specific event
const getEventAnalytics = async (req, res) => {
    try {
        const event = await Event_1.default.findById(req.params.id);
        if (!event)
            return (0, apiResponse_1.errorResponse)(res, "Event not found", 404);
        if (event.creator.toString() !== req.user?.id) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized", 403);
        }
        const totalAttendees = await Ticket_1.default.countDocuments({ event: event._id });
        const scannedCount = await Ticket_1.default.countDocuments({
            event: event._id,
            scanned: true,
        });
        const ticketsSold = await Payment_1.default.countDocuments({
            event: event._id,
            status: "success",
        });
        const revenue = await Payment_1.default.aggregate([
            { $match: { event: event._id, status: "success" } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        (0, apiResponse_1.successResponse)(res, {
            totalAttendees,
            scannedCount,
            ticketsSold,
            revenue: revenue[0]?.total || 0,
        });
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getEventAnalytics = getEventAnalytics;
