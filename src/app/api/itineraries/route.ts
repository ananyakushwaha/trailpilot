import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { ITINERARY_ROLES } from "@/lib/roles";
import { itineraryInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const templatesOnly = searchParams.get("templates") === "true";

    const where: Prisma.ItineraryWhereInput = { agencyId: session.agencyId };
    if (templatesOnly) where.isTemplate = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
      ];
    }

    const itineraries = await prisma.itinerary.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        destination: true,
        numDays: true,
        numNights: true,
        status: true,
        isTemplate: true,
        createdAt: true,
        lead: { select: { id: true, customerName: true } },
        customer: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ itineraries });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, ITINERARY_ROLES);

    const body = itineraryInputSchema.parse(await request.json());

    if (body.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: body.leadId, agencyId: session.agencyId },
      });
      if (!lead) return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }
    if (body.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: body.customerId, agencyId: session.agencyId },
      });
      if (!customer) return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
    }

    const itinerary = await prisma.itinerary.create({
      data: {
        agencyId: session.agencyId,
        leadId: body.leadId || null,
        customerId: body.customerId || null,
        title: body.title,
        destination: body.destination,
        numDays: body.numDays,
        numNights: body.numNights,
        travelStartDate: body.travelStartDate ? new Date(body.travelStartDate) : null,
        travelEndDate: body.travelEndDate ? new Date(body.travelEndDate) : null,
        travellerCount: body.travellerCount,
        budgetCategory: body.budgetCategory || null,
        hotelCategory: body.hotelCategory || null,
        tripType: body.tripType || null,
        interests: body.interests || null,
        transportMode: body.transportMode || null,
        specialNotes: body.specialNotes || null,
        status: body.status,
        isTemplate: body.isTemplate,
        createdById: session.userId,
        days: {
          create: body.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            activities: day.activities || "",
            pickupDropNotes: day.pickupDropNotes || null,
            hotelStay: day.hotelStay || null,
            inclusions: day.inclusions || null,
            exclusions: day.exclusions || null,
            importantInstructions: day.importantInstructions || null,
          })),
        },
      },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    return NextResponse.json({ itinerary }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
