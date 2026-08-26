import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_VIEW_ROLES, BOOKING_WRITE_ROLES } from "@/lib/roles";
import { bookingInputSchema } from "@/lib/validation";

const DEFAULT_CHECKLIST_ITEMS = [
  "Hotel confirmation",
  "Pickup details shared",
  "Payment reminder sent",
  "Customer documents collected",
  "Vendor payment settled",
  "Feedback request sent",
];

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_VIEW_ROLES);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Prisma.BookingWhereInput = { agencyId: session.agencyId };
    if (status) where.status = status as never;
    if (search) {
      where.OR = [
        { destination: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        payments: { select: { amount: true, direction: true } },
      },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);

    const body = bookingInputSchema.parse(await request.json());

    const customer = await prisma.customer.findFirst({
      where: { id: body.customerId, agencyId: session.agencyId },
    });
    if (!customer) {
      return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
    }
    if (body.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: body.leadId, agencyId: session.agencyId },
      });
      if (!lead) return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }
    if (body.itineraryId) {
      const itinerary = await prisma.itinerary.findFirst({
        where: { id: body.itineraryId, agencyId: session.agencyId },
      });
      if (!itinerary) return NextResponse.json({ error: "Invalid itinerary" }, { status: 400 });
    }

    const booking = await prisma.booking.create({
      data: {
        agencyId: session.agencyId,
        customerId: body.customerId,
        leadId: body.leadId || null,
        itineraryId: body.itineraryId || null,
        destination: body.destination,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        packageAmount: body.packageAmount,
        status: body.status,
        internalNotes: body.internalNotes || null,
        checklist: {
          create: DEFAULT_CHECKLIST_ITEMS.map((label) => ({ label })),
        },
      },
      include: { checklist: true },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
