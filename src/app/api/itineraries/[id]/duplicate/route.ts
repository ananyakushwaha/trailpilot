import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { ITINERARY_ROLES } from "@/lib/roles";

// Duplicate an itinerary (or save-as-template) for a similar customer
// without re-typing the whole day-wise plan.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, ITINERARY_ROLES);
    const { id } = await params;

    const source = await prisma.itinerary.findFirst({
      where: { id, agencyId: session.agencyId },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    if (!source) {
      throw new AuthError("Itinerary not found", 404);
    }

    const copy = await prisma.itinerary.create({
      data: {
        agencyId: session.agencyId,
        title: `${source.title} (copy)`,
        destination: source.destination,
        numDays: source.numDays,
        numNights: source.numNights,
        travellerCount: source.travellerCount,
        budgetCategory: source.budgetCategory,
        hotelCategory: source.hotelCategory,
        tripType: source.tripType,
        interests: source.interests,
        transportMode: source.transportMode,
        specialNotes: source.specialNotes,
        status: "DRAFT",
        isTemplate: false,
        createdById: session.userId,
        days: {
          create: source.days.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            activities: day.activities,
            pickupDropNotes: day.pickupDropNotes,
            hotelStay: day.hotelStay,
            inclusions: day.inclusions,
            exclusions: day.exclusions,
            importantInstructions: day.importantInstructions,
          })),
        },
      },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });

    return NextResponse.json({ itinerary: copy }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
