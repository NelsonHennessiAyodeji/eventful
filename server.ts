import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./docs/swagger";
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import ticketRoutes from "./routes/tickets";
import paymentRoutes from "./routes/payments";
import analyticsRoutes from "./routes/analytics";
import webhookRoutes from "./routes/webhooks";
import { errorHandler } from "./middleware/errorHandler";
import { startReminderScheduler } from "./services/reminderScheduler";

dotenv.config();

export const app = express();

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Body parser
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/webhooks", webhookRoutes);

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/health", (req, res) => res.send("OK"));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Start reminder scheduler
    startReminderScheduler();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
