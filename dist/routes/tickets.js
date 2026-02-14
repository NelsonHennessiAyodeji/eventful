"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ticketController_1 = require("../controllers/ticketController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/my-tickets", auth_1.protect, ticketController_1.getMyTickets);
router.post("/scan", auth_1.protect, (0, auth_1.authorize)("creator"), ticketController_1.scanTicket);
exports.default = router;
