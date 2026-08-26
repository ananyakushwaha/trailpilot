import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_WRITE_ROLES } from "@/lib/roles";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; bookingVendorId: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);
    const { id, bookingVendorId } = await params;

    const bookingVendor = await prisma.bookingVendor.findFirst({
      where: { id: bookingVendorId, bookingId: id, booking: { agencyId: session.agencyId } },
    });
    if (!bookingVendor) {
      throw new AuthError("Vendor assignment not found", 404);
    }

    await prisma.bookingVendor.delete({ where: { id: bookingVendorId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
