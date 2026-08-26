import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_WRITE_ROLES } from "@/lib/roles";
import { bookingVendorInputSchema } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_WRITE_ROLES);
    const { id } = await params;

    const booking = await prisma.booking.findFirst({ where: { id, agencyId: session.agencyId } });
    if (!booking) {
      throw new AuthError("Booking not found", 404);
    }

    const body = bookingVendorInputSchema.parse(await request.json());

    const vendor = await prisma.vendor.findFirst({
      where: { id: body.vendorId, agencyId: session.agencyId },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Invalid vendor" }, { status: 400 });
    }

    const bookingVendor = await prisma.bookingVendor.create({
      data: {
        bookingId: id,
        vendorId: body.vendorId,
        agreedCost: body.agreedCost ?? null,
        advancePaid: body.advancePaid ?? 0,
        notes: body.notes || null,
      },
      include: { vendor: true },
    });

    return NextResponse.json({ bookingVendor }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
