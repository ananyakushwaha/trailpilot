import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { customerInputSchema } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, agencyId: session.agencyId },
      include: {
        leads: {
          select: { id: true, destination: true, status: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ customer });
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
    requireRole(session, CUSTOMER_ROLES);
    const { id } = await params;

    const existing = await prisma.customer.findFirst({
      where: { id, agencyId: session.agencyId },
    });
    if (!existing) {
      throw new AuthError("Customer not found", 404);
    }

    const body = customerInputSchema.partial().parse(await request.json());

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.govIdType !== undefined && { govIdType: body.govIdType || null }),
        ...(body.govIdNumber !== undefined && { govIdNumber: body.govIdNumber || null }),
        ...(body.emergencyContact !== undefined && {
          emergencyContact: body.emergencyContact || null,
        }),
        ...(body.foodPreference !== undefined && {
          foodPreference: body.foodPreference || null,
        }),
        ...(body.hotelPreference !== undefined && {
          hotelPreference: body.hotelPreference || null,
        }),
        ...(body.transportPreference !== undefined && {
          transportPreference: body.transportPreference || null,
        }),
        ...(body.medicalNotes !== undefined && { medicalNotes: body.medicalNotes || null }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes || null }),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    return handleApiError(error);
  }
}
