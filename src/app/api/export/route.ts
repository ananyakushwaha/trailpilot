import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-response";

function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function csv(rows: string[][]) { return rows.map((row) => row.map(csvCell).join(",")).join("\r\n"); }

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const type = new URL(request.url).searchParams.get("type") ?? "leads";
    let rows: string[][];
    if (type === "bookings") {
      const bookings = await prisma.booking.findMany({ where: { agencyId: session.agencyId }, include: { customer: { select: { fullName: true, phone: true } }, payments: { select: { amount: true, direction: true } } }, orderBy: { startDate: "desc" } });
      rows = [["Customer", "Phone", "Destination", "Start date", "End date", "Package amount", "Collected", "Balance", "Status"], ...bookings.map((b) => { const collected = b.payments.filter((p) => p.direction === "CUSTOMER_IN").reduce((sum, p) => sum + p.amount, 0); return [b.customer.fullName, b.customer.phone, b.destination, b.startDate.toISOString().slice(0, 10), b.endDate.toISOString().slice(0, 10), String(b.packageAmount), String(collected), String(Math.max(0, b.packageAmount - collected)), b.status]; })];
    } else if (type === "customers") {
      const customers = await prisma.customer.findMany({ where: { agencyId: session.agencyId }, orderBy: { createdAt: "desc" } });
      rows = [["Name", "Phone", "Email", "Address", "Hotel preference", "Transport preference", "Created"], ...customers.map((c) => [c.fullName, c.phone, c.email ?? "", c.address ?? "", c.hotelPreference ?? "", c.transportPreference ?? "", c.createdAt.toISOString().slice(0, 10)])];
    } else {
      const leads = await prisma.lead.findMany({ where: { agencyId: session.agencyId }, orderBy: { createdAt: "desc" } });
      rows = [["Customer", "Phone", "Email", "Destination", "Travel start", "Adults", "Children", "Source", "Status", "Next follow-up"], ...leads.map((l) => [l.customerName, l.phone, l.email ?? "", l.destination ?? "", l.travelStartDate?.toISOString().slice(0, 10) ?? "", String(l.adults), String(l.children), l.source, l.status, l.nextFollowUpDate?.toISOString().slice(0, 10) ?? ""])];
    }
    return new NextResponse("\uFEFF" + csv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=trailos-${type}.csv`, "Cache-Control": "no-store" } });
  } catch (error) { return handleApiError(error); }
}
