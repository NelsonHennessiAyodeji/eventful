import express from "express";
import {
  getOverallAnalytics,
  getEventAnalytics,
} from "../controllers/analyticsController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     OverallAnalytics:
 *       type: object
 *       properties:
 *         totalAttendees:
 *           type: integer
 *         scannedCount:
 *           type: integer
 *         totalTicketsSold:
 *           type: integer
 *         totalRevenue:
 *           type: number
 *     EventAnalytics:
 *       type: object
 *       properties:
 *         totalAttendees:
 *           type: integer
 *         scannedCount:
 *           type: integer
 *         ticketsSold:
 *           type: integer
 *         revenue:
 *           type: number
 */

/**
 * @swagger
 * /analytics/overall:
 *   get:
 *     summary: Get overall analytics for creator (all events)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overall analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OverallAnalytics'
 */
router.get("/overall", protect, authorize("creator"), getOverallAnalytics);

/**
 * @swagger
 * /analytics/event/{id}:
 *   get:
 *     summary: Get analytics for a specific event (creator only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EventAnalytics'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.get("/event/:id", protect, authorize("creator"), getEventAnalytics);

export default router;
