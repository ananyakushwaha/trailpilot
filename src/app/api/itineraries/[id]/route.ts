import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { ITINERARY_ROLES } from "@/lib/roles";
import { itineraryInputSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const itinerary = await prisma.itinerary.findFirst({
      where: { id, agencyId: session.agencyId },
      include: {
        days: { orderBy: { dayNumber: "asc" } },
        lead: { select: { id: true, customerName: true, email: true, phone: true } },
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    return NextResponse.json({ itinerary });
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
    requireRole(session, ITINERARY_ROLES);
    const { id } = await params;

    const existing = await prisma.itinerary.findFirst({
      where: { id, agencyId: session.agencyId },
    });
    if (!existing) {
      throw new AuthError("Itinerary not found", 404);
    }

    const body = itineraryInputSchema.parse(await request.json());

    const itinerary = await prisma.$transaction(async (tx) => {
      await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });

      return tx.itinerary.update({
        where: { id },
        data: {
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
    });

    return NextResponse.json({ itinerary });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, ITINERARY_ROLES);
    const { id } = await params;

    const existing = await prisma.itinerary.findFirst({
      where: { id, agencyId: session.agencyId },
    });
    if (!existing) {
      throw new AuthError("Itinerary not found", 404);
    }

    await prisma.itinerary.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
