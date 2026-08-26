import { NextRequest, NextResponse } from "next/server";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { ITINERARY_ROLES } from "@/lib/roles";
import { aiItineraryDraftInputSchema } from "@/lib/validation";
import { generateItineraryDraft } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, ITINERARY_ROLES);

    const body = aiItineraryDraftInputSchema.parse(await request.json());
    const result = await generateItineraryDraft(body);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
