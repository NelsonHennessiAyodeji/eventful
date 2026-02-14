import express from "express";
import { sendReminders } from "../services/reminderScheduler";

const router = express.Router();

// Secret token to authorize cron jobs (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/check-reminders
 * Triggered by Vercel Cron Jobs or external cron service.
 * Requires Bearer token authorization.
 */
router.post("/check-reminders", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await sendReminders();
    res.json({ success: true });
  } catch (error: any) {
    console.error("Cron job error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
