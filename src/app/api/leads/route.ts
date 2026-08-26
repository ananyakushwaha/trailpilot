import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { LEAD_ROLES } from "@/lib/roles";
import { leadInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const followUp = searchParams.get("followUp"); // "overdue" | "today" | "upcoming"
    const assignedToId = searchParams.get("assignedToId");

    const where: Prisma.LeadWhereInput = { agencyId: session.agencyId };

    if (status) where.status = status as never;
    if (assignedToId) where.assignedToId = assignedToId;
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { destination: { contains: search, mode: "insensitive" } },
      ];
    }

    if (followUp) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(startOfToday);
      endOfToday.setHours(23, 59, 59, 999);

      if (followUp === "overdue") {
        where.nextFollowUpDate = { lt: startOfToday };
      } else if (followUp === "today") {
        where.nextFollowUpDate = { gte: startOfToday, lte: endOfToday };
      } else if (followUp === "upcoming") {
        where.nextFollowUpDate = { gt: endOfToday };
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: [{ nextFollowUpDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ leads });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, LEAD_ROLES);

    const body = leadInputSchema.parse(await request.json());

    if (body.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: body.assignedToId, agencyId: session.agencyId },
      });
      if (!assignee) {
        return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
      }
    }

    const lead = await prisma.lead.create({
      data: {
        agencyId: session.agencyId,
        customerName: body.customerName,
        phone: body.phone,
        email: body.email || null,
        destination: body.destination || null,
        travelStartDate: body.travelStartDate ? new Date(body.travelStartDate) : null,
        travelEndDate: body.travelEndDate ? new Date(body.travelEndDate) : null,
        adults: body.adults,
        children: body.children,
        budgetRange: body.budgetRange || null,
        hotelPreference: body.hotelPreference || null,
        transportRequirement: body.transportRequirement || null,
        source: body.source,
        status: body.status,
        assignedToId: body.assignedToId || null,
        nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
        internalNotes: body.internalNotes || null,
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
