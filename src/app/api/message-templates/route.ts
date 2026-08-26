import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { AGENCY_ADMIN_ROLES } from "@/lib/roles";
import { DEFAULT_TEMPLATES, TEMPLATE_KEYS, TEMPLATE_KEY_LABELS } from "@/lib/templates";

export async function GET() {
  try {
    const session = await requireSession();

    const overrides = await prisma.messageTemplate.findMany({
      where: { agencyId: session.agencyId },
    });

    const templates = TEMPLATE_KEYS.flatMap((key) =>
      (["WHATSAPP", "EMAIL"] as const).map((channel) => {
        const override = overrides.find((o) => o.key === key && o.channel === channel);
        const fallback = DEFAULT_TEMPLATES[key];
        return {
          key,
          label: TEMPLATE_KEY_LABELS[key],
          channel,
          subject: override?.subject ?? fallback.subject ?? null,
          body: override?.body ?? fallback.body,
          isCustomized: Boolean(override),
        };
      }),
    );

    return NextResponse.json({ templates });
  } catch (error) {
    return handleApiError(error);
  }
}

const upsertSchema = z.object({
  key: z.enum(TEMPLATE_KEYS),
  channel: z.enum(["WHATSAPP", "EMAIL"]),
  subject: z.string().optional(),
  body: z.string().min(1),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, AGENCY_ADMIN_ROLES);

    const body = upsertSchema.parse(await request.json());

    const template = await prisma.messageTemplate.upsert({
      where: {
        agencyId_key_channel: { agencyId: session.agencyId, key: body.key, channel: body.channel },
      },
      create: {
        agencyId: session.agencyId,
        key: body.key,
        channel: body.channel,
        subject: body.subject || null,
        body: body.body,
      },
      update: {
        subject: body.subject || null,
        body: body.body,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    return handleApiError(error);
  }
}
