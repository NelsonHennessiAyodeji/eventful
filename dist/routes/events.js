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
router
    .route("/")
    .get(eventController_1.getEvents)
    .post(auth_1.protect, (0, auth_1.authorize)("creator"), (0, validation_1.validate)(validation_1.eventValidation), eventController_1.createEvent);
router.get("/my-events", auth_1.protect, (0, auth_1.authorize)("creator"), eventController_1.getMyEvents);
router
    .route("/:id")
    .get(eventController_1.getEventById)
    .put(auth_1.protect, (0, auth_1.authorize)("creator"), (0, validation_1.validate)(validation_1.eventValidation), eventController_1.updateEvent)
    .delete(auth_1.protect, (0, auth_1.authorize)("creator"), eventController_1.deleteEvent);
router.get("/:id/attendees", auth_1.protect, (0, auth_1.authorize)("creator"), eventController_1.getEventAttendees);
exports.default = router;
