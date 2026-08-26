import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const agency = await prisma.agency.findUnique({ where: { id: session.agencyId } });

  return NextResponse.json({
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
    },
    agency: agency ? { id: agency.id, name: agency.name } : null,
  });
}
