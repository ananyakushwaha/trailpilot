import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { LEAD_ROLES } from "@/lib/roles";
import { leadInputSchema } from "@/lib/validation";

async function getOwnedLead(agencyId: string, id: string) {
  const lead = await prisma.lead.findFirst({ where: { id, agencyId } });
  if (!lead) {
    throw new AuthError("Lead not found", 404);
  }
  return lead;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, agencyId: session.agencyId },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
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
    requireRole(session, LEAD_ROLES);
    const { id } = await params;

    await getOwnedLead(session.agencyId, id);

    const body = leadInputSchema.partial().parse(await request.json());

    if (body.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: body.assignedToId, agencyId: session.agencyId },
      });
      if (!assignee) {
        return NextResponse.json({ error: "Invalid assignee" }, { status: 400 });
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.customerName !== undefined && { customerName: body.customerName }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email || null }),
        ...(body.destination !== undefined && { destination: body.destination || null }),
        ...(body.travelStartDate !== undefined && {
          travelStartDate: body.travelStartDate ? new Date(body.travelStartDate) : null,
        }),
        ...(body.travelEndDate !== undefined && {
          travelEndDate: body.travelEndDate ? new Date(body.travelEndDate) : null,
        }),
        ...(body.adults !== undefined && { adults: body.adults }),
        ...(body.children !== undefined && { children: body.children }),
        ...(body.budgetRange !== undefined && { budgetRange: body.budgetRange || null }),
        ...(body.hotelPreference !== undefined && {
          hotelPreference: body.hotelPreference || null,
        }),
        ...(body.transportRequirement !== undefined && {
          transportRequirement: body.transportRequirement || null,
        }),
        ...(body.source !== undefined && { source: body.source }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId || null }),
        ...(body.nextFollowUpDate !== undefined && {
          nextFollowUpDate: body.nextFollowUpDate ? new Date(body.nextFollowUpDate) : null,
        }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes || null }),
        ...(body.lostReason !== undefined && { lostReason: body.lostReason || null }),
      },
    });

    return NextResponse.json({ lead });
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
    requireRole(session, LEAD_ROLES);
    const { id } = await params;

    await getOwnedLead(session.agencyId, id);
    await prisma.lead.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
