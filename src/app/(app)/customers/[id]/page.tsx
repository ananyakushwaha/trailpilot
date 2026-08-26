"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  CustomerForm,
  customerToFormValues,
  type CustomerFormValues,
} from "@/components/CustomerForm";
import { LeadStatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type CustomerDetail = Record<string, unknown> & {
  id: string;
  fullName: string;
  leads: { id: string; destination: string | null; status: string; createdAt: string }[];
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, mutate } = useSWR<{ customer: CustomerDetail }>(
    `/api/customers/${id}`,
    fetcher,
  );

  async function handleSubmit(values: CustomerFormValues) {
    await apiFetch(`/api/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    mutate();
  }

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading customer...</p>;
  }

  const customer = data.customer;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/customers" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to customers
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{customer.fullName}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/itineraries/new?customerId=${id}`} className="btn-secondary">
            New itinerary
          </Link>
          <Link href={`/bookings/new?customerId=${id}`} className="btn-primary">
            New booking
          </Link>
        </div>
      </div>

      {customer.leads.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Trip history</h2>
          <ul className="divide-y divide-slate-100">
            {customer.leads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between py-2">
                <div>
                  <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-slate-900 hover:text-indigo-600">
                    {lead.destination ?? "Untitled trip"}
                  </Link>
                  <p className="text-xs text-slate-500">{formatDate(lead.createdAt)}</p>
                </div>
                <LeadStatusBadge status={lead.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <CustomerForm
        initial={customerToFormValues(customer)}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
