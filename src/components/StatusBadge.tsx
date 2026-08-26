const LEAD_STATUS_STYLES: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-50 text-blue-700",
  PROPOSAL_SENT: "bg-amber-50 text-amber-700",
  NEGOTIATING: "bg-purple-50 text-purple-700",
  WON: "bg-emerald-50 text-emerald-700",
  LOST: "bg-red-50 text-red-700",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATING: "Negotiating",
  WON: "Won",
  LOST: "Lost",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${LEAD_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700"}`}>
      {LEAD_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const LEAD_SOURCE_OPTIONS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "REFERRAL", label: "Referral" },
  { value: "WEBSITE", label: "Website" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OTHER", label: "Other" },
];
