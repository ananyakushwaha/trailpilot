import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_VIEW_ROLES, BOOKING_WRITE_ROLES } from "@/lib/roles";
import { bookingInputSchema } from "@/lib/validation";
import { triggerBookingAutomation } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_VIEW_ROLES);
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: { id, agencyId: session.agencyId },
      include: {
        customer: true,
        lead: { select: { id: true, customerName: true } },
        itinerary: { select: { id: true, title: true } },
        vendors: { include: { vendor: true }, orderBy: { createdAt: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
        checklist: { orderBy: { createdAt: "asc" } },
        feedback: true,
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);
    const { id } = await params;

    const existing = await prisma.booking.findFirst({ where: { id, agencyId: session.agencyId } });
    if (!existing) {
      throw new AuthError("Booking not found", 404);
    }

    const body = bookingInputSchema.partial().parse(await request.json());

    if (body.itineraryId) {
      const itinerary = await prisma.itinerary.findFirst({
        where: { id: body.itineraryId, agencyId: session.agencyId },
      });
      if (!itinerary) return NextResponse.json({ error: "Invalid itinerary" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(body.destination !== undefined && { destination: body.destination }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
        ...(body.packageAmount !== undefined && { packageAmount: body.packageAmount }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.itineraryId !== undefined && { itineraryId: body.itineraryId || null }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes || null }),
      },
    });

    if (body.status && body.status !== existing.status) {
      if (body.status === "CONFIRMED") await triggerBookingAutomation(id, "CONFIRMED");
      if (body.status === "COMPLETED") await triggerBookingAutomation(id, "COMPLETED");
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return handleApiError(error);
  }
}
