"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paystackWebhook = void 0;
const Payment_1 = __importDefault(require("../models/Payment"));
const ticketController_1 = require("./ticketController");
// Paystack webhook endpoint
const paystackWebhook = async (req, res) => {
    const event = req.body;
    // Verify the signature (optional but recommended)
    if (event.event === "charge.success") {
        const reference = event.data.reference;
        try {
            const payment = await Payment_1.default.findOne({ reference });
            if (payment && payment.status === "pending") {
                payment.status = "success";
                await payment.save();
                await (0, ticketController_1.createTicket)(payment.id);
            }
        }
        catch (error) {
            console.error("Webhook error:", error);
        }
    }
    res.sendStatus(200);
};
exports.paystackWebhook = paystackWebhook;
