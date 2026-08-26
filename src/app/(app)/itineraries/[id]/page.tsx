"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  ItineraryForm,
  itineraryToFormValues,
  type ItineraryFormValues,
} from "@/components/ItineraryForm";
import { SendMessageButtons } from "@/components/SendMessageButtons";
import { apiFetch, ApiError } from "@/lib/api-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ItineraryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, mutate } = useSWR<{
    itinerary: Record<string, unknown> & { id: string; title: string };
  }>(`/api/itineraries/${id}`, fetcher);
  const { data: leadsData } = useSWR<{ leads: { id: string; customerName: string }[] }>(
    "/api/leads",
    fetcher,
  );
  const { data: customersData } = useSWR<{ customers: { id: string; fullName: string }[] }>(
    "/api/customers",
    fetcher,
  );
  const { data: meData } = useSWR<{ agency: { name: string } | null }>("/api/auth/me", fetcher);

  async function handleSubmit(values: ItineraryFormValues) {
    await apiFetch(`/api/itineraries/${id}`, { method: "PATCH", body: JSON.stringify(values) });
    mutate();
  }

  async function handleDuplicate() {
    try {
      const { itinerary } = await apiFetch<{ itinerary: { id: string } }>(
        `/api/itineraries/${id}/duplicate`,
        { method: "POST" },
      );
      router.push(`/itineraries/${itinerary.id}`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not duplicate itinerary");
    }
  }

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading itinerary...</p>;
  }

  const itinerary = data.itinerary;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/itineraries" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to itineraries
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{itinerary.title}</h1>
        </div>
        <div className="flex gap-2">
          <a href={`/api/itineraries/${id}/pdf`} target="_blank" rel="noopener noreferrer" className="btn-secondary">
            Download PDF
          </a>
          <button onClick={handleDuplicate} className="btn-secondary">
            Duplicate
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Share with customer</h2>
        <SendMessageButtons
          templateKey="ITINERARY_SHARED"
          recipientPhone={
            (itinerary.lead as { phone?: string } | null)?.phone ??
            (itinerary.customer as { phone?: string } | null)?.phone
          }
          recipientEmail={
            (itinerary.lead as { email?: string } | null)?.email ??
            (itinerary.customer as { email?: string } | null)?.email
          }
          leadId={(itinerary.lead as { id?: string } | null)?.id}
          variables={{
            customer_name:
              (itinerary.lead as { customerName?: string } | null)?.customerName ??
              (itinerary.customer as { fullName?: string } | null)?.fullName ??
              "there",
            agency_name: meData?.agency?.name ?? "",
            trip_destination: itinerary.destination as string,
            itinerary_link:
              typeof window !== "undefined"
                ? `${window.location.origin}/api/public/itineraries/${id}/pdf`
                : "",
          }}
        />
      </div>

      <ItineraryForm
        initial={itineraryToFormValues(itinerary)}
        leads={leadsData?.leads ?? []}
        customers={customersData?.customers ?? []}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
