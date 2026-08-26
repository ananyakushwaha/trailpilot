import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_WRITE_ROLES } from "@/lib/roles";
import { paymentInputSchema } from "@/lib/validation";
import { triggerBookingAutomation } from "@/lib/notifications";

function nextReceiptNumber(agencyId: string, count: number) {
  const year = new Date().getFullYear();
  return `RCPT-${year}-${agencyId.slice(-4).toUpperCase()}-${String(count + 1).padStart(4, "0")}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);
    const { id } = await params;

    const booking = await prisma.booking.findFirst({ where: { id, agencyId: session.agencyId } });
    if (!booking) {
      throw new AuthError("Booking not found", 404);
    }

    const body = paymentInputSchema.parse(await request.json());

    if (body.direction === "VENDOR_OUT" && !body.bookingVendorId) {
      return NextResponse.json(
        { error: "A vendor assignment is required for outgoing payments" },
        { status: 400 },
      );
    }
    if (body.bookingVendorId) {
      const bookingVendor = await prisma.bookingVendor.findFirst({
        where: { id: body.bookingVendorId, bookingId: id },
      });
      if (!bookingVendor) {
        return NextResponse.json({ error: "Invalid vendor assignment" }, { status: 400 });
      }
    }

    const receiptCount =
      body.direction === "CUSTOMER_IN"
        ? await prisma.payment.count({
            where: { agencyId: session.agencyId, direction: "CUSTOMER_IN" },
          })
        : 0;

    const payment = await prisma.payment.create({
      data: {
        agencyId: session.agencyId,
        bookingId: id,
        bookingVendorId: body.bookingVendorId || null,
        direction: body.direction,
        amount: body.amount,
        method: body.method,
        reference: body.reference || null,
        note: body.note || null,
        paidAt: body.paidAt ? new Date(body.paidAt) : new Date(),
        receiptNumber:
          body.direction === "CUSTOMER_IN" ? nextReceiptNumber(session.agencyId, receiptCount) : null,
      },
    });

    if (body.bookingVendorId && body.direction === "VENDOR_OUT") {
      await prisma.bookingVendor.update({
        where: { id: body.bookingVendorId },
        data: { advancePaid: { increment: body.amount } },
      });
    }

    if (body.direction === "CUSTOMER_IN") {
      await triggerBookingAutomation(id, "PAYMENT_RECEIVED");
    }

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
