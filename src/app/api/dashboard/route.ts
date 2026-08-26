import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const session = await requireSession();
    const agencyId = session.agencyId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setHours(23, 59, 59, 999);
    const sevenDaysOut = new Date(startOfToday);
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

    const [
      totalLeadsThisMonth,
      newLeadsToday,
      leadsPendingFollowUp,
      wonLeadsThisMonth,
      totalCustomers,
      recentLeads,
      confirmedBookingsThisMonth,
      activeTrips: activeBookings.length,
      upcomingTrips,
      activeBookings,
      revenueThisMonthPayments,
      feedbackAgg,
      recentFeedback,
    ] = await Promise.all([
      prisma.lead.count({ where: { agencyId, createdAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { agencyId, createdAt: { gte: startOfToday, lte: endOfToday } } }),
      prisma.lead.count({
        where: { agencyId, nextFollowUpDate: { lte: endOfToday }, status: { notIn: ["WON", "LOST"] } },
      }),
      prisma.lead.count({ where: { agencyId, status: "WON", updatedAt: { gte: startOfMonth } } }),
      prisma.customer.count({ where: { agencyId } }),
      prisma.lead.findMany({
        where: { agencyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, customerName: true, destination: true, status: true, createdAt: true },
      }),
      prisma.booking.count({
        where: { agencyId, createdAt: { gte: startOfMonth }, status: { notIn: ["DRAFT", "CANCELLED"] } },
      }),
      prisma.booking.findMany({
        where: { agencyId, startDate: { gte: startOfToday, lte: sevenDaysOut }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
        orderBy: { startDate: "asc" },
        select: { id: true, destination: true, startDate: true, customer: { select: { fullName: true } } },
      }),
      prisma.booking.findMany({
        where: { agencyId, status: { notIn: ["CANCELLED", "REFUNDED", "COMPLETED"] } },
        select: {
          packageAmount: true,
          payments: { select: { amount: true, direction: true } },
          vendors: { select: { agreedCost: true, advancePaid: true } },
        },
      }),
      prisma.payment.aggregate({
        where: { agencyId, direction: "CUSTOMER_IN", paidAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.feedback.aggregate({ where: { agencyId }, _avg: { overallRating: true } }),
      prisma.feedback.findMany({
        where: { agencyId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { customer: { select: { fullName: true } }, booking: { select: { destination: true } } },
      }),
    ]);

    let paymentsPendingFromCustomers = 0;
    let vendorPaymentsPending = 0;
    for (const booking of activeBookings) {
      const collected = booking.payments
        .filter((p) => p.direction === "CUSTOMER_IN")
        .reduce((sum, p) => sum + p.amount, 0);
      paymentsPendingFromCustomers += Math.max(booking.packageAmount - collected, 0);
      for (const v of booking.vendors) {
        if (v.agreedCost != null) {
          vendorPaymentsPending += Math.max(v.agreedCost - v.advancePaid, 0);
        }
      }
    }

    return NextResponse.json({
      totalLeadsThisMonth,
      newLeadsToday,
      leadsPendingFollowUp,
      wonLeadsThisMonth,
      totalCustomers,
      recentLeads,
      confirmedBookingsThisMonth,
      upcomingTrips,
      paymentsPendingFromCustomers,
      vendorPaymentsPending,
      revenueCollectedThisMonth: revenueThisMonthPayments._sum.amount ?? 0,
      averageCustomerRating: feedbackAgg._avg.overallRating
        ? Math.round(feedbackAgg._avg.overallRating * 10) / 10
        : null,
      recentFeedback: recentFeedback.map((f) => ({
        id: f.id,
        customerName: f.customer.fullName,
        destination: f.booking.destination,
        overallRating: f.overallRating,
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
