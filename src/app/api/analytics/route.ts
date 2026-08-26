import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requirePremium } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

const STOPWORDS = new Set([
  "the", "and", "was", "were", "for", "with", "that", "this", "very", "but", "not",
  "could", "would", "should", "have", "had", "has", "our", "your", "their", "they",
  "trip", "more", "some", "from", "were", "are", "you", "was", "did", "get", "got",
]);

function extractKeywords(texts: string[]): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    for (const word of words) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function average(values: (number | null)[]) {
  const filtered = values.filter((v): v is number => v != null);
  if (filtered.length === 0) return null;
  return Math.round((filtered.reduce((sum, v) => sum + v, 0) / filtered.length) * 10) / 10;
}

const VENDOR_RATING_FIELD: Record<string, "hotelRating" | "driverRating" | "guideRating" | "activityRating"> = {
  HOTEL: "hotelRating",
  HOMESTAY: "hotelRating",
  DRIVER: "driverRating",
  TRANSPORT: "driverRating",
  GUIDE: "guideRating",
  ACTIVITY_PROVIDER: "activityRating",
};

export async function GET() {
  try {
    const session = await requireSession();
    await requirePremium(session);
    const agencyId = session.agencyId;

    const [feedbackList, payments, bookingVendors, lowFeedback, leads] = await Promise.all([
      prisma.feedback.findMany({ where: { agencyId } }),
      prisma.payment.findMany({
        where: { agencyId, direction: "CUSTOMER_IN" },
        select: { amount: true, paidAt: true },
      }),
      prisma.bookingVendor.findMany({
        where: { booking: { agencyId } },
        include: { vendor: true, booking: { include: { feedback: true } } },
      }),
      prisma.feedback.findMany({
        where: { agencyId, overallRating: { lte: 2 } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { fullName: true } }, booking: { select: { destination: true } } },
      }),
      prisma.lead.findMany({ where: { agencyId }, select: { source: true } }),
    ]);

    const averageOverallRating = average(feedbackList.map((f) => f.overallRating));
    const reviewsRequestedCount = feedbackList.filter((f) => f.reviewRequested).length;
    const leadSourceCounts = new Map<string, number>();
    for (const lead of leads) leadSourceCounts.set(lead.source, (leadSourceCounts.get(lead.source) ?? 0) + 1);
    const leadSourceBreakdown = Array.from(leadSourceCounts.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    const complaintKeywords = extractKeywords(
      feedbackList.map((f) => f.whatCanImprove).filter((v): v is string => Boolean(v)),
    );

    const vendorRatings = new Map<string, { name: string; category: string; ratings: number[] }>();
    for (const bv of bookingVendors) {
      const feedback = bv.booking.feedback;
      if (!feedback) continue;
      const field = VENDOR_RATING_FIELD[bv.vendor.category];
      if (!field) continue;
      const rating = feedback[field];
      if (rating == null) continue;
      const entry = vendorRatings.get(bv.vendorId) ?? {
        name: bv.vendor.name,
        category: bv.vendor.category,
        ratings: [],
      };
      entry.ratings.push(rating);
      vendorRatings.set(bv.vendorId, entry);
    }
    const vendorWiseRatings = Array.from(vendorRatings.values())
      .map((v) => ({ name: v.name, category: v.category, averageRating: average(v.ratings), count: v.ratings.length }))
      .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));

    const now = new Date();
    const revenueByMonth: { month: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const total = payments
        .filter((p) => p.paidAt >= monthStart && p.paidAt < monthEnd)
        .reduce((sum, p) => sum + p.amount, 0);
      revenueByMonth.push({
        month: monthStart.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        total,
      });
    }

    return NextResponse.json({
      averageOverallRating,
      totalFeedbackCount: feedbackList.length,
      reviewsRequestedCount,
      complaintKeywords,
      vendorWiseRatings,
      revenueByMonth,
      recentComplaints: lowFeedback.map((f) => ({
        id: f.id,
        customerName: f.customer.fullName,
        destination: f.booking.destination,
        overallRating: f.overallRating,
        whatCanImprove: f.whatCanImprove,
        createdAt: f.createdAt,
      })),
      leadSourceBreakdown,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
