import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, AuthError } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { LEAD_ROLES } from "@/lib/roles";

// Converts a won lead into a reusable customer profile without asking the
// sales team to retype details already captured on the lead.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    requireRole(session, LEAD_ROLES);
    const { id } = await params;

    const lead = await prisma.lead.findFirst({
      where: { id, agencyId: session.agencyId },
    });
    if (!lead) {
      throw new AuthError("Lead not found", 404);
    }
    if (lead.convertedCustomerId) {
      return NextResponse.json({ error: "Lead already converted" }, { status: 409 });
    }

    const { customer, updatedLead } = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          agencyId: session.agencyId,
          fullName: lead.customerName,
          phone: lead.phone,
          email: lead.email,
          hotelPreference: lead.hotelPreference,
          transportPreference: lead.transportRequirement,
          internalNotes: lead.internalNotes,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: { status: "WON", convertedCustomerId: customer.id },
      });

      return { customer, updatedLead };
    });

    return NextResponse.json({ customer, lead: updatedLead }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
