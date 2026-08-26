import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";

// Unauthenticated by design — powers the public feedback form link sent to
// customers after their trip. Only exposes what the feedback page needs.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        destination: true,
        startDate: true,
        endDate: true,
        status: true,
        agency: { select: { name: true } },
        customer: { select: { fullName: true } },
        feedback: { select: { id: true } },
        vendors: {
          select: { vendor: { select: { category: true } } },
        },
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        destination: booking.destination,
        startDate: booking.startDate,
        endDate: booking.endDate,
        agencyName: booking.agency.name,
        customerName: booking.customer.fullName,
        alreadySubmitted: Boolean(booking.feedback),
        hasHotel: booking.vendors.some((v) => v.vendor.category === "HOTEL" || v.vendor.category === "HOMESTAY"),
        hasDriver: booking.vendors.some((v) => v.vendor.category === "DRIVER" || v.vendor.category === "TRANSPORT"),
        hasGuide: booking.vendors.some((v) => v.vendor.category === "GUIDE"),
        hasActivity: booking.vendors.some((v) => v.vendor.category === "ACTIVITY_PROVIDER"),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
