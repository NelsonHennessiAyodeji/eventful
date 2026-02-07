import Event from "../models/Event";
import Ticket from "../models/Ticket";
import Payment from "../models/Payment";
import { Types } from "mongoose";

export class AnalyticsService {
  static async getEventAnalytics(eventId: Types.ObjectId) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const tickets = await Ticket.find({ event: eventId });
    const payments = await Payment.find({
      event: eventId,
      status: "successful",
    });

    const totalTickets = tickets.length;
    const scannedTickets = tickets.filter((t) => t.isScanned).length;
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const ticketTypeBreakdown = tickets.reduce((acc: any, ticket) => {
      const type = ticket.ticketType;
      if (!acc[type]) {
        acc[type] = { total: 0, scanned: 0, revenue: 0 };
      }
      acc[type].total++;
      if (ticket.isScanned) acc[type].scanned++;
      // Find the payment for this ticket (assuming one ticket per payment for simplicity)
      const payment = payments.find(
        (p) => p.metadata.ticketId === ticket._id.toString()
      );
      if (payment) {
        acc[type].revenue += payment.amount;
      }
      return acc;
    }, {});

    // Daily sales for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySales = await Payment.aggregate([
      {
        $match: {
          event: eventId,
          status: "successful",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      event: {
        id: event._id,
        title: event.title,
        totalCapacity: event.tickets.total,
        ticketsSold: event.tickets.sold,
      },
      analytics: {
        tickets: {
          total: totalTickets,
          scanned: scannedTickets,
          paid: payments.length,
          attendanceRate:
            totalTickets > 0 ? (scannedTickets / totalTickets) * 100 : 0,
        },
        revenue: {
          total: totalRevenue,
          currency: event.tickets.currency,
        },
        ticketTypeBreakdown,
        dailySales,
      },
    };
  }

  static async getOrganizerAnalytics(organizerId: Types.ObjectId) {
    const events = await Event.find({ organizer: organizerId });
    const eventIds = events.map((e) => e._id);

    const tickets = await Ticket.find({ event: { $in: eventIds } });
    const payments = await Payment.find({
      event: { $in: eventIds },
      status: "successful",
    });

    const totalEvents = events.length;
    const publishedEvents = events.filter((e) => e.isPublished).length;
    const totalTicketsSold = tickets.length;
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          event: { $in: eventIds },
          status: "successful",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$amount" },
          ticketCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const eventPerformance = await Promise.all(
      events.map(async (event) => {
        const eventTickets = tickets.filter(
          (t) => t.event.toString() === event._id.toString()
        );
        const eventPayments = payments.filter(
          (p) => p.event.toString() === event._id.toString()
        );

        const sold = eventTickets.length;
        const scanned = eventTickets.filter((t) => t.isScanned).length;
        const revenue = eventPayments.reduce(
          (sum, payment) => sum + payment.amount,
          0
        );

        return {
          id: event._id,
          title: event.title,
          startDate: event.startDate,
          tickets: {
            total: event.tickets.total,
            sold,
            scanned,
            attendanceRate: sold > 0 ? (scanned / sold) * 100 : 0,
          },
          revenue,
        };
      })
    );

    return {
      summary: {
        totalEvents,
        publishedEvents,
        totalTicketsSold,
        totalRevenue,
        averageRevenuePerEvent:
          totalEvents > 0 ? totalRevenue / totalEvents : 0,
        averageTicketsPerEvent:
          totalEvents > 0 ? totalTicketsSold / totalEvents : 0,
      },
      monthlyRevenue,
      eventPerformance,
    };
  }
}
