import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerBookingAutomation } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  const received = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!expected || received !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const inThreeDays = new Date(now);
  inThreeDays.setDate(inThreeDays.getDate() + 3);
  const since = new Date(now);
  since.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      startDate: { gte: now, lte: inThreeDays },
      status: { notIn: ["CANCELLED", "REFUNDED", "COMPLETED"] },
    },
    include: { payments: { select: { amount: true, direction: true } } },
  });

  let sent = 0;
  for (const booking of bookings) {
    const collected = booking.payments
      .filter((payment) => payment.direction === "CUSTOMER_IN")
      .reduce((sum, payment) => sum + payment.amount, 0);
    if (booking.packageAmount <= collected) continue;

    const alreadySent = await prisma.notificationLog.findFirst({
      where: { bookingId: booking.id, templateKey: "PAYMENT_REMINDER", createdAt: { gte: since } },
    });
    if (!alreadySent) {
      await triggerBookingAutomation(booking.id, "PAYMENT_RECEIVED");
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, paymentRemindersSent: sent });
}
