import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";
import { renderReceiptPdf } from "@/lib/pdf/receipt-pdf";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  RAZORPAY: "Razorpay",
  OTHER: "Other",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const payment = await prisma.payment.findFirst({
      where: { id, agencyId: session.agencyId, direction: "CUSTOMER_IN" },
      include: { booking: { include: { customer: true } } },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const agency = await prisma.agency.findUniqueOrThrow({ where: { id: session.agencyId } });

    const pdfBuffer = await renderReceiptPdf({
      agencyName: agency.name,
      receiptNumber: payment.receiptNumber ?? `RCPT-${payment.id.slice(-8).toUpperCase()}`,
      paidAt: payment.paidAt.toISOString(),
      customerName: payment.booking.customer.fullName,
      destination: payment.booking.destination,
      amount: payment.amount,
      method: PAYMENT_METHOD_LABELS[payment.method] ?? payment.method,
      reference: payment.reference,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="receipt-${payment.id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
