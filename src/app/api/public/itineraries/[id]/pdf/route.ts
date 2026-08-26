import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-response";
import { renderItineraryPdf } from "@/lib/pdf/itinerary-pdf";

// Unauthenticated by design: this is the "share on WhatsApp/email as a PDF
// link" endpoint from the PRD. Itinerary ids are unguessable cuids, so
// possession of the link is the access control, same as a Google Docs
// "anyone with the link" share.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id },
      include: { days: { orderBy: { dayNumber: "asc" } }, agency: true },
    });
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });
    }

    const pdfBuffer = await renderItineraryPdf({
      agencyName: itinerary.agency.name,
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
