import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created successfully
 */
router.post(
  "/",
  authenticate,
  authorize("creator"),
  EventController.createEvent
);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all published events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of events
 */
router.get("/", EventController.getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 */
router.get("/:id", EventController.getEventById);

/**
 * @swagger
 * /api/events/my-events:
 *   get:
 *     summary: Get events created by current user (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's events
 */
router.get(
  "/my-events",
  authenticate,
  authorize("creator"),
  EventController.getMyEvents
);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event (Creator only)
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
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
 */
router.put(
  "/:id",
  authenticate,
  authorize("creator"),
  EventController.updateEvent
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event (Creator only)
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
 *         description: Event deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  authorize("creator"),
  EventController.deleteEvent
);

/**
 * @swagger
 * /api/events/{id}/attendees:
 *   get:
 *     summary: Get event attendees (Creator only)
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
 *         description: List of attendees
 */
router.get(
  "/:id/attendees",
  authenticate,
  authorize("creator"),
  EventController.getEventAttendees
);

export default router;
