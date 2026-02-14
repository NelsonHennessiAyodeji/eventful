"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController_1 = require("../controllers/eventController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         location:
 *           type: string
 *         price:
 *           type: number
 *         totalTickets:
 *           type: integer
 *         availableTickets:
 *           type: integer
 *         creator:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         reminderDaysBefore:
 *           type: array
 *           items:
 *             type: integer
 *         imageUrl:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AttendeeTicket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         attendee:
 *           $ref: '#/components/schemas/User'
 *         scanned:
 *           type: boolean
 *         qrCode:
 *           type: string
 */
/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
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
 *                     $ref: '#/components/schemas/Event'
 */
router.get("/", eventController_1.getEvents);
/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event (creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *               - price
 *               - totalTickets
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               totalTickets:
 *                 type: integer
 *               reminderDaysBefore:
 *                 type: array
 *                 items:
 *                   type: integer
 *               imageUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (not creator)
 *       401:
 *         description: Unauthorized
 */
router.post("/", auth_1.protect, (0, auth_1.authorize)("creator"), (0, validation_1.validate)(validation_1.eventValidation), eventController_1.createEvent);
/**
 * @swagger
 * /events/my-events:
 *   get:
 *     summary: Get events created by the logged-in creator
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of creator's events
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
 *                     $ref: '#/components/schemas/Event'
 */
router.get("/my-events", auth_1.protect, (0, auth_1.authorize)("creator"), eventController_1.getMyEvents);
/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a single event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get("/:id", eventController_1.getEventById);
/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event (creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.put("/:id", auth_1.protect, (0, auth_1.authorize)("creator"), (0, validation_1.validate)(validation_1.eventValidation), eventController_1.updateEvent);
/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event (creator only)
 *     tags: [Events]
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
 *         description: Event deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.delete("/:id", auth_1.protect, (0, auth_1.authorize)("creator"), eventController_1.deleteEvent);
/**
 * @swagger
 * /events/{id}/attendees:
 *   get:
 *     summary: Get attendees for a specific event (creator only)
 *     tags: [Events]
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
 *         description: List of attendees with tickets
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
 *                     $ref: '#/components/schemas/AttendeeTicket'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Event not found
 */
router.get("/:id/attendees", auth_1.protect, (0, auth_1.authorize)("creator"), eventController_1.getEventAttendees);
exports.default = router;
