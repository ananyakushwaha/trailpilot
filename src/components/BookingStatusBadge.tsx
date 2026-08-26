const BOOKING_STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  QUOTATION_SENT: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  ADVANCE_RECEIVED: "bg-sky-50 text-sky-700",
  VENDORS_ASSIGNED: "bg-purple-50 text-purple-700",
  ACTIVE_TRIP: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  REFUNDED: "bg-orange-50 text-orange-700",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  QUOTATION_SENT: "Quotation Sent",
  CONFIRMED: "Confirmed",
  ADVANCE_RECEIVED: "Advance Received",
  VENDORS_ASSIGNED: "Vendors Assigned",
  ACTIVE_TRIP: "Active Trip",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${BOOKING_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}
