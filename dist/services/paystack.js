"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTransaction = exports.initializeTransaction = void 0;
const axios_1 = __importDefault(require("axios"));
const paystack = axios_1.default.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
    },
});
const initializeTransaction = async (email, amount, reference) => {
    try {
        const response = await paystack.post("/transaction/initialize", {
            email,
            amount: amount * 100, // Paystack uses kobo
            reference,
            callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
        });
        return response.data;
    }
    catch (error) {
        throw error;
    }
};
exports.initializeTransaction = initializeTransaction;
const verifyTransaction = async (reference) => {
    try {
        const response = await paystack.get(`/transaction/verify/${reference}`);
        return response.data;
    }
    catch (error) {
        throw error;
    }
};
exports.verifyTransaction = verifyTransaction;
