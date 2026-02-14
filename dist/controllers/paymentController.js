"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventPayments = exports.verifyPayment = exports.initializePayment = void 0;
const Payment_1 = __importDefault(require("../models/Payment"));
const Event_1 = __importDefault(require("../models/Event"));
const paystack_1 = require("../services/paystack");
const apiResponse_1 = require("../utils/apiResponse");
const uuid_1 = require("uuid");
// @desc    Initialize payment for an event
const initializePayment = async (req, res) => {
    try {
        const { eventId } = req.body;
        const event = await Event_1.default.findById(eventId);
        if (!event)
            return (0, apiResponse_1.errorResponse)(res, "Event not found", 404);
        if (event.availableTickets < 1) {
            return (0, apiResponse_1.errorResponse)(res, "No tickets available", 400);
        }
        const reference = `EVT-${(0, uuid_1.v4)()}`;
        const payment = await Payment_1.default.create({
            event: eventId,
            attendee: req.user?.id,
            amount: event.price,
            reference,
            status: "pending",
        });
        const response = await (0, paystack_1.initializeTransaction)(req.user.email, event.price, reference);
        if (response.status) {
            (0, apiResponse_1.successResponse)(res, { authorization_url: response.data.authorization_url, reference }, "Payment initialized");
        }
        else {
            (0, apiResponse_1.errorResponse)(res, "Paystack initialization failed", 500);
        }
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.initializePayment = initializePayment;
// @desc    Verify payment (can be called by frontend after redirect)
const verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        const payment = await Payment_1.default.findOne({ reference });
        if (!payment)
            return (0, apiResponse_1.errorResponse)(res, "Payment not found", 404);
        const verification = await (0, paystack_1.verifyTransaction)(reference);
        if (verification.data.status === "success") {
            payment.status = "success";
            await payment.save();
            // Create ticket
            const { createTicket } = await Promise.resolve().then(() => __importStar(require("./ticketController")));
            await createTicket(payment.id);
            (0, apiResponse_1.successResponse)(res, { payment }, "Payment verified successfully");
        }
        else {
            payment.status = "failed";
            await payment.save();
            (0, apiResponse_1.errorResponse)(res, "Payment verification failed", 400);
        }
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.verifyPayment = verifyPayment;
// @desc    Get payments for creator's events
const getEventPayments = async (req, res) => {
    try {
        const events = await Event_1.default.find({ creator: req.user?.id }).select("_id");
        const eventIds = events.map((e) => e._id);
        const payments = await Payment_1.default.find({ event: { $in: eventIds } })
            .populate("event", "title")
            .populate("attendee", "name email");
        (0, apiResponse_1.successResponse)(res, payments);
    }
    catch (error) {
        (0, apiResponse_1.errorResponse)(res, "Server error", 500);
    }
};
exports.getEventPayments = getEventPayments;
