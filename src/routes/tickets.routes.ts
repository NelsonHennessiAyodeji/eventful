import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";
import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validator";
import { body, param } from "express-validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management endpoints
 */

/**
 * @swagger
 * /api/tickets/purchase:
 *   post:
 *     summary: Purchase tickets for an event
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
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *               ticketType:
 *                 type: string
 *                 default: General Admission
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 1
 *               metadata:
 *                 type: object
 *                 properties:
 *                   seatNumber:
 *                     type: string
 *                   row:
 *                     type: string
 *                   section:
 *                     type: string
 *     responses:
 *       200:
 *         description: Ticket purchase initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tickets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *                 payment:
 *                   type: object
 *                   properties:
 *                     authorizationUrl:
 *                       type: string
 *                     accessCode:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 */
router.post(
  "/purchase",
  authenticate,
  [
    body("eventId").isMongoId().withMessage("Valid event ID is required"),
    body("ticketType").optional().isString().trim(),
    body("quantity").optional().isInt({ min: 1, max: 10 }),
    body("metadata").optional().isObject(),
  ],
  validateRequest,
  TicketController.purchaseTicket
);

/**
 * @swagger
 * /api/tickets/my-tickets:
 *   get:
 *     summary: Get all tickets purchased by the current user
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *     responses:
 *       200:
 *         description: List of user's tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tickets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     limit:
 *                       type: integer
 */
router.get("/my-tickets", authenticate, TicketController.getMyTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get a specific ticket by ID
 *     tags: [Tickets]
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
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 */
router.get(
  "/:id",
  authenticate,
  [param("id").isMongoId().withMessage("Valid ticket ID is required")],
  validateRequest,
  TicketController.getTicketById
);

/**
 * @swagger
 * /api/tickets/validate:
 *   post:
 *     summary: Validate a ticket using QR code (Creator only)
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
 *               - qrCodeData
 *             properties:
 *               qrCodeData:
 *                 type: string
 *                 description: QR code data scanned from the ticket
 *     responses:
 *       200:
 *         description: Ticket validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 ticket:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     event:
 *                       type: string
 *                     user:
 *                       type: string
 *                     ticketType:
 *                       type: string
 *                     scannedAt:
 *                       type: string
 *                       format: date-time
 */
router.post(
  "/validate",
  authenticate,
  [body("qrCodeData").notEmpty().withMessage("QR code data is required")],
  validateRequest,
  TicketController.validateTicket
);

/**
 * @swagger
 * /api/tickets/verify:
 *   get:
 *     summary: Verify payment for tickets
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment reference from Paystack
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 */
router.get("/verify", TicketController.verifyPayment);

export default router;
