import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import rateLimit from "express-rate-limit";

// Import routes
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import ticketRoutes from "./routes/tickets";
import paymentRoutes from "./routes/payments";
import analyticsRoutes from "./routes/analytics";
import webhookRoutes from "./routes/webhooks";
import cronRoutes from "./routes/cron"; // new cron route

import { errorHandler } from "./middleware/errorHandler";
import { startReminderScheduler } from "./services/reminderScheduler";

dotenv.config();

const app = express();

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api", limiter);

// Serve static files from the public folder (absolute path)
app.use(express.static(path.join(__dirname, "../public")));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/cron", cronRoutes); // new cron endpoint

// Health check
app.get("/health", (req, res) => res.send("OK"));

// Error handling middleware
app.use(errorHandler);

// Cached database connection for serverless
let cachedDb: typeof mongoose | null = null;

export async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(process.env.MONGODB_URI!);
  cachedDb = db;
  return db;
}

// Start server only when run directly (not as a serverless function)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectToDatabase().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Start reminder scheduler only in development (not on Vercel)
    if (process.env.NODE_ENV !== "production") {
      startReminderScheduler();
    }
  });
}

export { app };
