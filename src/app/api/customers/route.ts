import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { CUSTOMER_ROLES } from "@/lib/roles";
import { customerInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Prisma.CustomerWhereInput = { agencyId: session.agencyId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true } } },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, CUSTOMER_ROLES);

    const body = customerInputSchema.parse(await request.json());

    const customer = await prisma.customer.create({
      data: {
        agencyId: session.agencyId,
        fullName: body.fullName,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        govIdType: body.govIdType || null,
        govIdNumber: body.govIdNumber || null,
        emergencyContact: body.emergencyContact || null,
        foodPreference: body.foodPreference || null,
        hotelPreference: body.hotelPreference || null,
        transportPreference: body.transportPreference || null,
        medicalNotes: body.medicalNotes || null,
        internalNotes: body.internalNotes || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
