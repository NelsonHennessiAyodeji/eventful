"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
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
router.get("/overall", auth_1.protect, (0, auth_1.authorize)("creator"), analyticsController_1.getOverallAnalytics);
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
router.get("/event/:id", auth_1.protect, (0, auth_1.authorize)("creator"), analyticsController_1.getEventAnalytics);
exports.default = router;
