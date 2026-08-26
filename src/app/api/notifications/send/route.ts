import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, requirePremium } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { BOOKING_VIEW_ROLES } from "@/lib/roles";
import { TEMPLATE_KEYS } from "@/lib/templates";
import { sendNotification } from "@/lib/notifications";

const sendSchema = z.object({
  channel: z.enum(["WHATSAPP", "EMAIL"]),
  templateKey: z.enum(TEMPLATE_KEYS),
  recipient: z.string().min(3),
  variables: z.record(z.string(), z.string()).default({}),
  bookingId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, BOOKING_VIEW_ROLES);

    const body = sendSchema.parse(await request.json());
    if (body.channel === "WHATSAPP") await requirePremium(session);

    if (body.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: body.bookingId, agencyId: session.agencyId },
      });
      if (!booking) return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
    }
    if (body.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: body.leadId, agencyId: session.agencyId },
      });
      if (!lead) return NextResponse.json({ error: "Invalid lead" }, { status: 400 });
    }

    const log = await sendNotification({
      agencyId: session.agencyId,
      channel: body.channel,
      templateKey: body.templateKey,
      recipient: body.recipient,
      variables: body.variables,
      bookingId: body.bookingId,
      leadId: body.leadId,
    });

    return NextResponse.json({ log });
  } catch (error) {
    return handleApiError(error);
  }
}
