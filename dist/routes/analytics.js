"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get("/overall", auth_1.protect, (0, auth_1.authorize)("creator"), analyticsController_1.getOverallAnalytics);
router.get("/event/:id", auth_1.protect, (0, auth_1.authorize)("creator"), analyticsController_1.getEventAnalytics);
exports.default = router;
