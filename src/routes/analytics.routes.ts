import { Router } from "express";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Event analytics endpoints
 */

/**
 * @swagger
 * /api/analytics/event/{id}:
 *   get:
 *     summary: Get analytics for a specific event (Creator only)
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
 */
router.get(
  "/event/:id",
  authenticate,
  authorize("creator"),
  AnalyticsController.getEventAnalytics
);

/**
 * @swagger
 * /api/analytics/organizer:
 *   get:
 *     summary: Get analytics for the organizer (Creator only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizer analytics
 */
router.get(
  "/organizer",
  authenticate,
  authorize("creator"),
  AnalyticsController.getOrganizerAnalytics
);

export default router;
