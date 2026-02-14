"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         event:
 *           $ref: '#/components/schemas/Event'
 *         attendee:
 *           $ref: '#/components/schemas/User'
 *         amount:
 *           type: number
 *         reference:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, success, failed]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     PaymentInitResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             authorization_url:
 *               type: string
 *             reference:
 *               type: string
 */
/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize a payment for an event (attendee only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment initialized, returns Paystack authorization URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentInitResponse'
 *       400:
 *         description: No tickets available or invalid event
 *       401:
 *         description: Unauthorized
 */
router.post("/initialize", auth_1.protect, (0, auth_1.authorize)("attendee"), paymentController_1.initializePayment);
/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment by reference
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Verification failed
 *       404:
 *         description: Payment not found
 */
router.get("/verify/:reference", paymentController_1.verifyPayment);
/**
 * @swagger
 * /payments/event-payments:
 *   get:
 *     summary: Get all payments for creator's events (creator only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments for creator's events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 */
router.get("/event-payments", auth_1.protect, (0, auth_1.authorize)("creator"), paymentController_1.getEventPayments);
exports.default = router;
