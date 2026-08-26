import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

const signupSchema = z.object({
  agencyName: z.string().min(2, "Agency name is required"),
  ownerName: z.string().min(2, "Your name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = signupSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(body.password);

    const { agency, user } = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: body.agencyName,
          email: body.email,
          phone: body.phone,
        },
      });

      const user = await tx.user.create({
        data: {
          agencyId: agency.id,
          name: body.ownerName,
          email: body.email,
          passwordHash,
          role: "AGENCY_OWNER",
        },
      });

      return { agency, user };
    });

    const token = await createSessionToken({
      userId: user.id,
      agencyId: agency.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      agency: { id: agency.id, name: agency.name },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
