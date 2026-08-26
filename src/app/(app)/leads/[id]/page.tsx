"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { LeadForm, leadToFormValues, type LeadFormValues } from "@/components/LeadForm";
import { SendMessageButtons } from "@/components/SendMessageButtons";
import { apiFetch, ApiError } from "@/lib/api-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);

  const { data, isLoading, mutate } = useSWR<{
    lead: Record<string, unknown> & { id: string; convertedCustomerId: string | null };
  }>(`/api/leads/${id}`, fetcher);
  const { data: usersData } = useSWR<{ users: { id: string; name: string }[] }>(
    "/api/users",
    fetcher,
  );
  const { data: meData } = useSWR<{ agency: { name: string } | null }>("/api/auth/me", fetcher);

  async function handleSubmit(values: LeadFormValues) {
    await apiFetch(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    mutate();
  }

  async function handleConvert() {
    setConvertError(null);
    setConverting(true);
    try {
      const { customer } = await apiFetch<{ customer: { id: string } }>(
        `/api/leads/${id}/convert`,
        { method: "POST" },
      );
      router.push(`/customers/${customer.id}`);
    } catch (err) {
      setConvertError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setConverting(false);
    }
  }

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading lead...</p>;
  }

  const lead = data.lead;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/leads" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to leads
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{lead.customerName as string}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/itineraries/new?leadId=${id}`} className="btn-secondary">
            Prepare itinerary
          </Link>
          {lead.convertedCustomerId ? (
            <Link href={`/customers/${lead.convertedCustomerId}`} className="btn-secondary">
              View customer profile
            </Link>
          ) : (
            <button onClick={handleConvert} disabled={converting} className="btn-primary">
              {converting ? "Converting..." : "Convert to customer"}
            </button>
          )}
        </div>
      </div>

      {convertError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{convertError}</p>
      )}

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Follow up with this lead</h2>
        <SendMessageButtons
          templateKey="LEAD_FOLLOW_UP"
          recipientPhone={lead.phone as string}
          recipientEmail={lead.email as string | null}
          leadId={id}
          variables={{
            customer_name: lead.customerName as string,
            agency_name: meData?.agency?.name ?? "",
            trip_destination: (lead.destination as string) ?? "your trip",
          }}
        />
      </div>

      <LeadForm
        initial={leadToFormValues(lead)}
        users={usersData?.users ?? []}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
