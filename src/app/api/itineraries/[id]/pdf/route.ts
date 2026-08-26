import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { renderItineraryPdf } from "@/lib/pdf/itinerary-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const itinerary = await prisma.itinerary.findFirst({
      where: { id, agencyId: session.agencyId },
      include: { days: { orderBy: { dayNumber: "asc" } } },
    });
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const agency = await prisma.agency.findUniqueOrThrow({ where: { id: session.agencyId } });

    const pdfBuffer = await renderItineraryPdf({
      agencyName: agency.name,
      title: itinerary.title,
      destination: itinerary.destination,
      numDays: itinerary.numDays,
      numNights: itinerary.numNights,
      travellerCount: itinerary.travellerCount,
      travelStartDate: itinerary.travelStartDate?.toISOString() ?? null,
      travelEndDate: itinerary.travelEndDate?.toISOString() ?? null,
      days: itinerary.days,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${itinerary.title.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
