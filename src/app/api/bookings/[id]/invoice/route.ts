import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { renderInvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: { id, agencyId: session.agencyId },
      include: { customer: true, payments: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const agency = await prisma.agency.findUniqueOrThrow({ where: { id: session.agencyId } });
    const collected = booking.payments
      .filter((p) => p.direction === "CUSTOMER_IN")
      .reduce((sum, p) => sum + p.amount, 0);

    const pdfBuffer = await renderInvoicePdf({
      agencyName: agency.name,
      agencyAddress: agency.address,
      invoiceNumber: `INV-${booking.id.slice(-8).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      customerName: booking.customer.fullName,
      customerPhone: booking.customer.phone,
      destination: booking.destination,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      packageAmount: booking.packageAmount,
      collected,
      balance: booking.packageAmount - collected,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${booking.id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
