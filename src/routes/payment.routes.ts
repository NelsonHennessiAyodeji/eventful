import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing endpoints
 */

/**
 * @swagger
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize a payment for tickets
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
 *               ticketType:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 */
router.post("/initialize", authenticate, PaymentController.initializePayment);

/**
 * @swagger
 * /api/payments/verify:
 *   get:
 *     summary: Verify a payment
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verification result
 */
router.get("/verify", PaymentController.verifyPayment);

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post("/webhook", PaymentController.handleWebhook);

export default router;
