"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post("/initialize", auth_1.protect, (0, auth_1.authorize)("attendee"), paymentController_1.initializePayment);
router.get("/verify/:reference", paymentController_1.verifyPayment);
router.get("/event-payments", auth_1.protect, (0, auth_1.authorize)("creator"), paymentController_1.getEventPayments);
exports.default = router;
