import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { OPERATIONS_ROLES } from "@/lib/roles";
import { vendorInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Prisma.VendorWhereInput = { agencyId: session.agencyId };
    if (category) where.category = category as never;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ vendors });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, OPERATIONS_ROLES);

    const body = vendorInputSchema.parse(await request.json());

    const vendor = await prisma.vendor.create({
      data: {
        agencyId: session.agencyId,
        name: body.name,
        category: body.category,
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        location: body.location || null,
        priceRangeNotes: body.priceRangeNotes || null,
        gstDetails: body.gstDetails || null,
        rating: body.rating ?? null,
        paymentTerms: body.paymentTerms || null,
        availabilityNotes: body.availabilityNotes || null,
        internalComments: body.internalComments || null,
      },
    });

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
