"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserReminder = exports.createEventReminders = exports.startReminderScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const Reminder_1 = __importDefault(require("../models/Reminder"));
const email_1 = require("./email");
// Run every hour to check for reminders
const startReminderScheduler = () => {
    node_cron_1.default.schedule("0 * * * *", async () => {
        console.log("Running reminder scheduler...");
        const now = new Date();
        const reminders = await Reminder_1.default.find({
            remindAt: { $lte: now },
            sent: false,
        })
            .populate("event")
            .populate("user");
        for (const reminder of reminders) {
            try {
                const event = reminder.event;
                const user = reminder.user;
                const emailHtml = `<h1>Reminder: ${event.title}</h1><p>Starts at ${event.date}</p>`;
                await (0, email_1.sendReminderEmail)(user.email, `Event Reminder: ${event.title}`, emailHtml);
                reminder.sent = true;
                await reminder.save();
                console.log(`Reminder sent for event ${event.title} to ${user.email}`);
            }
            catch (err) {
                console.error("Failed to send reminder", err);
            }
        }
    });
};
exports.startReminderScheduler = startReminderScheduler;
// Function to create reminders for an event (creator set)
const createEventReminders = async (eventId, userId, eventDate, daysBefore) => {
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
    await Reminder_1.default.insertMany(reminders);
};
exports.createEventReminders = createEventReminders;
// Function for attendees to set custom reminder
const createUserReminder = async (eventId, userId, remindAt) => {
    const reminder = new Reminder_1.default({ event: eventId, user: userId, remindAt });
    await reminder.save();
};
exports.createUserReminder = createUserReminder;
