import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const leadId = searchParams.get("leadId");

    const logs = await prisma.notificationLog.findMany({
      where: {
        agencyId: session.agencyId,
        ...(bookingId && { bookingId }),
        ...(leadId && { leadId }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return handleApiError(error);
  }
}
