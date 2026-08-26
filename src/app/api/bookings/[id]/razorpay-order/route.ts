import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_WRITE_ROLES } from "@/lib/roles";
import { createRazorpayOrder, isRazorpayConfigured } from "@/lib/razorpay";

// Optional online payment flow. Manual entry (cash/UPI/bank transfer) via
// POST /api/bookings/[id]/payments always works regardless of Razorpay.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);
    const { id } = await params;

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
        { status: 501 },
      );
    }

    const booking = await prisma.booking.findFirst({
      where: { id, agencyId: session.agencyId },
      include: { payments: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const collected = booking.payments
      .filter((p) => p.direction === "CUSTOMER_IN")
      .reduce((sum, p) => sum + p.amount, 0);
    const balance = booking.packageAmount - collected;
    if (balance <= 0) {
      return NextResponse.json({ error: "This booking has no balance due" }, { status: 400 });
    }

    const order = await createRazorpayOrder(balance, `booking-${booking.id.slice(-12)}`);
    return NextResponse.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    return handleApiError(error);
  }
}
