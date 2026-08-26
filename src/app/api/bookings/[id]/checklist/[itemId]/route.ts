import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_WRITE_ROLES } from "@/lib/roles";

const toggleSchema = z.object({ completed: z.boolean() });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);
    const { id, itemId } = await params;

    const item = await prisma.bookingChecklistItem.findFirst({
      where: { id: itemId, bookingId: id, booking: { agencyId: session.agencyId } },
    });
    if (!item) {
      throw new AuthError("Checklist item not found", 404);
    }

    const body = toggleSchema.parse(await request.json());

    const updated = await prisma.bookingChecklistItem.update({
      where: { id: itemId },
      data: { completed: body.completed, completedAt: body.completed ? new Date() : null },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
