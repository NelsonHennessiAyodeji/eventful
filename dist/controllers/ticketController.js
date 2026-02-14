"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanTicket = exports.getMyTickets = exports.createTicket = void 0;
const Ticket_1 = __importDefault(require("../models/Ticket"));
const Payment_1 = __importDefault(require("../models/Payment"));
const qrCode_1 = require("../services/qrCode");
const apiResponse_1 = require("../utils/apiResponse");
// @desc    Purchase ticket (after successful payment)
// This would be called by webhook after payment verification
const createTicket = async (paymentId) => {
    try {
        const payment = await Payment_1.default.findById(paymentId).populate("event attendee");
        if (!payment)
            throw new Error("Payment not found");
        const event = payment.event;
        // Generate unique data for QR (e.g., ticket id + random)
        const qrData = JSON.stringify({
            ticketId: payment._id,
            event: event._id,
            attendee: payment.attendee._id,
        });
        const qrCode = await (0, qrCode_1.generateQRCode)(qrData);
        const ticket = await Ticket_1.default.create({
            event: event._id,
            attendee: payment.attendee._id,
            payment: payment._id,
            qrCode,
        });
        // Decrease available tickets
        event.availableTickets -= 1;
        await event.save();
        return ticket;
    }
    catch (error) {
        throw error;
    }
};
exports.createTicket = createTicket;
// @desc    Get user's tickets
const getMyTickets = async (req, res) => {
    try {
        const tickets = await Ticket_1.default.find({ attendee: req.user?.id }).populate("event");
        (0, apiResponse_1.successResponse)(res, tickets);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getMyTickets = getMyTickets;
// @desc    Verify ticket (scan QR) - creator only
const scanTicket = async (req, res) => {
    try {
        const { ticketId } = req.body;
        const ticket = await Ticket_1.default.findById(ticketId).populate("event");
        if (!ticket)
            return (0, apiResponse_1.errorResponse)(res, "Ticket not found", 404);
        const event = ticket.event;
        if (event.creator.toString() !== req.user?.id) {
            return (0, apiResponse_1.errorResponse)(res, "Not authorized to scan this ticket", 403);
        }
        if (ticket.scanned) {
            return (0, apiResponse_1.errorResponse)(res, "Ticket already scanned", 400);
        }
        ticket.scanned = true;
        await ticket.save();
        (0, apiResponse_1.successResponse)(res, { scanned: true }, "Ticket verified");
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.scanTicket = scanTicket;
