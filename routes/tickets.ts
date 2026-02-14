import express from "express";
import { getMyTickets, scanTicket } from "../controllers/ticketController";
import { protect, authorize } from "../middleware/auth";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Ticket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         event:
 *           $ref: '#/components/schemas/Event'
 *         attendee:
 *           $ref: '#/components/schemas/User'
 *         qrCode:
 *           type: string
 *         scanned:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /tickets/my-tickets:
 *   get:
 *     summary: Get tickets of the logged-in attendee
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tickets
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
 *                     $ref: '#/components/schemas/Ticket'
 */
router.get("/my-tickets", protect, getMyTickets);

/**
 * @swagger
 * /tickets/scan:
 *   post:
 *     summary: Scan a ticket (verify entry) - creator only
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *             properties:
 *               ticketId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ticket verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     scanned:
 *                       type: boolean
 *       400:
 *         description: Ticket already scanned or invalid
 *       403:
 *         description: Not authorized to scan this ticket
 *       404:
 *         description: Ticket not found
 */
router.post("/scan", protect, authorize("creator"), scanTicket);

export default router;
