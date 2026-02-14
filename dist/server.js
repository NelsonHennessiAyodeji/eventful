"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./docs/swagger"));
const auth_1 = __importDefault(require("./routes/auth"));
const events_1 = __importDefault(require("./routes/events"));
const tickets_1 = __importDefault(require("./routes/tickets"));
const payments_1 = __importDefault(require("./routes/payments"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const webhooks_1 = __importDefault(require("./routes/webhooks"));
const errorHandler_1 = require("./middleware/errorHandler");
const reminderScheduler_1 = require("./services/reminderScheduler");
dotenv_1.default.config();
exports.app = (0, express_1.default)();
// Global rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
exports.app.use("/api", limiter);
// Body parser
exports.app.use(express_1.default.json());
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Routes
exports.app.use("/api/auth", auth_1.default);
exports.app.use("/api/events", events_1.default);
exports.app.use("/api/tickets", tickets_1.default);
exports.app.use("/api/payments", payments_1.default);
exports.app.use("/api/analytics", analytics_1.default);
exports.app.use("/api/webhooks", webhooks_1.default);
// Swagger documentation
exports.app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
// Health check
exports.app.get("/health", (req, res) => res.send("OK"));
// Error handling middleware
exports.app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 5000;
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then(() => {
    console.log("Connected to MongoDB");
    exports.app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Start reminder scheduler
    (0, reminderScheduler_1.startReminderScheduler)();
})
    .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});
