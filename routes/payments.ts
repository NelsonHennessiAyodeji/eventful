import express from "express";
import {
  initializePayment,
  verifyPayment,
  getEventPayments,
} from "../controllers/paymentController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

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
router.post("/initialize", protect, authorize("attendee"), initializePayment);

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
router.get("/verify/:reference", verifyPayment);

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
router.get("/event-payments", protect, authorize("creator"), getEventPayments);

export default router;
