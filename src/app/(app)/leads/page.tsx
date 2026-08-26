"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { LEAD_STATUS_OPTIONS, LeadStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";

type Lead = {
  id: string;
  customerName: string;
  phone: string;
  destination: string | null;
  status: string;
  nextFollowUpDate: string | null;
  assignedTo: { id: string; name: string } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LeadsPage() {
  return (
    <Suspense>
      <LeadsPageInner />
    </Suspense>
  );
}

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [followUp, setFollowUp] = useState(searchParams.get("followUp") ?? "");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (followUp) params.set("followUp", followUp);

  const { data, isLoading } = useSWR<{ leads: Lead[] }>(
    `/api/leads?${params.toString()}`,
    fetcher,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500">Every enquiry, in one pipeline.</p>
        </div>
        <Link href="/leads/new" className="btn-primary">
          Add lead
        </Link>
      </div>

      <div className="card flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, phone or destination"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {LEAD_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className="select max-w-xs"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        >
          <option value="">All follow-ups</option>
          <option value="overdue">Overdue / due today</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned to</th>
              <th className="px-4 py-3">Next follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading leads...
                </td>
              </tr>
            )}
            {!isLoading && data?.leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No leads match these filters.
                </td>
              </tr>
            )}
            {data?.leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {lead.customerName}
                  </Link>
                  <p className="text-xs text-slate-500">{lead.phone}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.destination ?? "—"}</td>
                <td className="px-4 py-3">
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.assignedTo?.name ?? "Unassigned"}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(lead.nextFollowUpDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
