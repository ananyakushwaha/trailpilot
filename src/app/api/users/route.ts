import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, hashPassword } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { AGENCY_ADMIN_ROLES, INVITABLE_STAFF_ROLES } from "@/lib/roles";

// List team members for the current agency. Scoped by session.agencyId so
// a user can never enumerate another agency's staff.
export async function GET() {
  try {
    const session = await requireSession();

    const users = await prisma.user.findMany({
      where: { agencyId: session.agencyId, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(INVITABLE_STAFF_ROLES as [string, ...string[]]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    requireRole(session, AGENCY_ADMIN_ROLES);

    const body = createUserSchema.parse(await request.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        agencyId: session.agencyId,
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role as never,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
