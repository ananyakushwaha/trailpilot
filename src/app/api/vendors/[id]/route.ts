import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { OPERATIONS_ROLES } from "@/lib/roles";
import { vendorInputSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const vendor = await prisma.vendor.findFirst({
      where: { id, agencyId: session.agencyId },
      include: {
        bookingVendors: {
          include: { booking: { select: { id: true, destination: true, startDate: true, status: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
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
    requireRole(session, OPERATIONS_ROLES);
    const { id } = await params;

    const existing = await prisma.vendor.findFirst({ where: { id, agencyId: session.agencyId } });
    if (!existing) {
      throw new AuthError("Vendor not found", 404);
    }

    const body = vendorInputSchema.partial().parse(await request.json());

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson || null }),
        ...(body.phone !== undefined && { phone: body.phone || null }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.location !== undefined && { location: body.location || null }),
        ...(body.priceRangeNotes !== undefined && {
          priceRangeNotes: body.priceRangeNotes || null,
        }),
        ...(body.gstDetails !== undefined && { gstDetails: body.gstDetails || null }),
        ...(body.rating !== undefined && { rating: body.rating ?? null }),
        ...(body.paymentTerms !== undefined && { paymentTerms: body.paymentTerms || null }),
        ...(body.availabilityNotes !== undefined && {
          availabilityNotes: body.availabilityNotes || null,
        }),
        ...(body.internalComments !== undefined && {
          internalComments: body.internalComments || null,
        }),
      },
    });

    return NextResponse.json({ vendor });
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
    requireRole(session, OPERATIONS_ROLES);
    const { id } = await params;

    const existing = await prisma.vendor.findFirst({ where: { id, agencyId: session.agencyId } });
    if (!existing) {
      throw new AuthError("Vendor not found", 404);
    }

    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
