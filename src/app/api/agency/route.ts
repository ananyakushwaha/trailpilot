import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { AGENCY_ADMIN_ROLES } from "@/lib/roles";
import { encryptSecret } from "@/lib/secrets";

export async function GET() {
  try {
    const session = await requireSession();
    const agency = await prisma.agency.findUniqueOrThrow({
      where: { id: session.agencyId },
    });
    return NextResponse.json({ agency: { ...agency, whatsappAccessTokenEnc: undefined, emailApiKeyEnc: undefined, whatsappConnected: Boolean(agency.whatsappAccessTokenEnc && agency.whatsappPhoneNumberId), emailConnected: Boolean(agency.emailApiKeyEnc) } });
  } catch (error) {
    return handleApiError(error);
  }
}

const updateAgencySchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  googleReviewUrl: z.string().url().optional().nullable().or(z.literal("")),
  whatsappAccessToken: z.string().optional(),
  whatsappPhoneNumberId: z.string().optional().nullable(),
  emailApiKey: z.string().optional(),
  emailFrom: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, AGENCY_ADMIN_ROLES);

    const body = updateAgencySchema.parse(await request.json());

    const agency = await prisma.agency.update({
      where: { id: session.agencyId },
      data: {
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        logoUrl: body.logoUrl || null,
        googleReviewUrl: body.googleReviewUrl || null,
        ...(body.whatsappAccessToken ? { whatsappAccessTokenEnc: encryptSecret(body.whatsappAccessToken) } : {}),
        ...(body.whatsappPhoneNumberId !== undefined ? { whatsappPhoneNumberId: body.whatsappPhoneNumberId || null } : {}),
        ...(body.emailApiKey ? { emailApiKeyEnc: encryptSecret(body.emailApiKey) } : {}),
        ...(body.emailFrom !== undefined ? { emailFrom: body.emailFrom || null } : {}),
      },
    });

    return NextResponse.json({ agency });
  } catch (error) {
    return handleApiError(error);
  }
}
