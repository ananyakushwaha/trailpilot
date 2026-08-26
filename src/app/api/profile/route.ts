import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, hashPassword, requireSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional().or(z.literal("")),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = profileSchema.parse(await request.json());
    const user = await prisma.user.findFirst({ where: { id: session.userId, agencyId: session.agencyId } });
    if (!user) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    if (body.newPassword) {
      if (!body.currentPassword || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name, email: body.email, ...(body.newPassword ? { passwordHash: await hashPassword(body.newPassword) } : {}) },
      select: { id: true, name: true, email: true, role: true },
    });
    await setSessionCookie(await createSessionToken({ ...session, name: updated.name, email: updated.email }));
    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
