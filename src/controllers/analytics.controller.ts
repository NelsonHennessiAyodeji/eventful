import { Request, Response } from "express";
import Event from "../models/Event";
import Ticket from "../models/Ticket";
import Payment from "../models/Payment";
import { AuthRequest } from "../middlewares/auth";

export class AnalyticsController {
  static async getEventAnalytics(req: AuthRequest, res: Response) {
    try {
      const eventId = req.params.id;

      // Check if event exists and user is organizer
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (event.organizer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get ticket statistics
      const tickets = await Ticket.find({ event: eventId });

      const totalTickets = tickets.length;
      const scannedTickets = tickets.filter((t) => t.isScanned).length;
      const paidTickets = tickets.filter(
        (t) => t.paymentStatus === "paid"
      ).length;

      // Get payment statistics
      const payments = await Payment.find({ event: eventId });
      const totalRevenue = payments
        .filter((p) => p.status === "successful")
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Get ticket type breakdown
      const ticketTypeBreakdown = tickets.reduce((acc: any, ticket) => {
        const type = ticket.ticketType;
        if (!acc[type]) {
          acc[type] = { total: 0, scanned: 0, revenue: 0 };
        }
        acc[type].total++;
        if (ticket.isScanned) acc[type].scanned++;
        if (ticket.paymentStatus === "paid") {
          acc[type].revenue += ticket.price;
        }
        return acc;
      }, {});

      // Get daily sales data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailySales = await Payment.aggregate([
        {
          $match: {
            event: event._id,
            status: "successful",
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get attendance rate
      const attendanceRate =
        totalTickets > 0 ? (scannedTickets / totalTickets) * 100 : 0;

      res.json({
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
            paid: paidTickets,
            attendanceRate: parseFloat(attendanceRate.toFixed(2)),
          },
          revenue: {
            total: totalRevenue,
            currency: event.tickets.currency,
          },
          ticketTypeBreakdown,
          dailySales,
          summary: {
            availableTickets: event.tickets.total - event.tickets.sold,
            soldOutPercentage: (event.tickets.sold / event.tickets.total) * 100,
            averageTicketPrice:
              paidTickets > 0 ? totalRevenue / paidTickets : 0,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrganizerAnalytics(req: AuthRequest, res: Response) {
    try {
      const organizerId = req.user._id;

      // Get all events by organizer
      const events = await Event.find({ organizer: organizerId });

      // Get all tickets for organizer's events
      const eventIds = events.map((e) => e._id);
      const tickets = await Ticket.find({ event: { $in: eventIds } });

      // Get all payments for organizer's events
      const payments = await Payment.find({ event: { $in: eventIds } });

      // Calculate overall statistics
      const totalEvents = events.length;
      const publishedEvents = events.filter((e) => e.isPublished).length;

      const totalTicketsSold = tickets.filter(
        (t) => t.paymentStatus === "paid"
      ).length;
      const totalRevenue = payments
        .filter((p) => p.status === "successful")
        .reduce((sum, payment) => sum + payment.amount, 0);

      // Get monthly revenue (last 6 months)
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

      // Get event performance
      const eventPerformance = await Promise.all(
        events.map(async (event) => {
          const eventTickets = tickets.filter(
            (t) => t.event.toString() === event._id.toString()
          );
          const eventPayments = payments.filter(
            (p) => p.event.toString() === event._id.toString()
          );

          const sold = eventTickets.filter(
            (t) => t.paymentStatus === "paid"
          ).length;
          const scanned = eventTickets.filter((t) => t.isScanned).length;
          const revenue = eventPayments
            .filter((p) => p.status === "successful")
            .reduce((sum, payment) => sum + payment.amount, 0);

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

      // Sort events by revenue (descending)
      eventPerformance.sort((a, b) => b.revenue - a.revenue);

      // Calculate average metrics
      const averageRevenuePerEvent =
        totalEvents > 0 ? totalRevenue / totalEvents : 0;
      const averageTicketsPerEvent =
        totalEvents > 0 ? totalTicketsSold / totalEvents : 0;

      res.json({
        summary: {
          totalEvents,
          publishedEvents,
          totalTicketsSold,
          totalRevenue,
          averageRevenuePerEvent: parseFloat(averageRevenuePerEvent.toFixed(2)),
          averageTicketsPerEvent: parseFloat(averageTicketsPerEvent.toFixed(2)),
        },
        monthlyRevenue,
        eventPerformance,
        recentActivity: {
          last30DaysTickets: tickets.filter(
            (t) =>
              t.purchaseDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          upcomingEvents: events.filter(
            (e) => e.startDate > new Date() && e.isPublished
          ).length,
          activeEvents: events.filter(
            (e) =>
              e.startDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) &&
              e.endDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          ).length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
