import express from "express";
import { paystackWebhook } from "../controllers/webhookController";

const router = express.Router();

/**
 * @swagger
 * /webhooks/paystack:
 *   post:
 *     summary: Paystack webhook endpoint (public)
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 */
router.post("/paystack", paystackWebhook);

export default router;
