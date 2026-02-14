import cron from "node-cron";
import Reminder from "../models/Reminder";
import Event from "../models/Event";
import User from "../models/User";
import { sendReminderEmail } from "./email";

// Run every hour to check for reminders
export const startReminderScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Running reminder scheduler...");
    const now = new Date();
    const reminders = await Reminder.find({
      remindAt: { $lte: now },
      sent: false,
    })
      .populate("event")
      .populate("user");

    for (const reminder of reminders) {
      try {
        const event = reminder.event as any;
        const user = reminder.user as any;
        const emailHtml = `<h1>Reminder: ${event.title}</h1><p>Starts at ${event.date}</p>`;
        await sendReminderEmail(
          user.email,
          `Event Reminder: ${event.title}`,
          emailHtml
        );
        reminder.sent = true;
        await reminder.save();
        console.log(`Reminder sent for event ${event.title} to ${user.email}`);
      } catch (err) {
        console.error("Failed to send reminder", err);
      }
    }
  });
};

// Function to create reminders for an event (creator set)
export const createEventReminders = async (
  eventId: string,
  userId: string,
  eventDate: Date,
  daysBefore: number[]
) => {
  const reminders = daysBefore.map((days) => {
    const remindAt = new Date(eventDate);
    remindAt.setDate(remindAt.getDate() - days);
    return {
      event: eventId,
      user: userId,
      remindAt,
      sent: false,
    };
  });
  await Reminder.insertMany(reminders);
};

// Function for attendees to set custom reminder
export const createUserReminder = async (
  eventId: string,
  userId: string,
  remindAt: Date
) => {
  const reminder = new Reminder({ event: eventId, user: userId, remindAt });
  await reminder.save();
};
