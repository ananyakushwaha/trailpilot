"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";
import {
  ItineraryForm,
  emptyItineraryForm,
  type ItineraryFormValues,
} from "@/components/ItineraryForm";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function NewItineraryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: leadsData } = useSWR<{ leads: { id: string; customerName: string }[] }>(
    "/api/leads",
    fetcher,
  );
  const { data: customersData } = useSWR<{ customers: { id: string; fullName: string }[] }>(
    "/api/customers",
    fetcher,
  );

  const initial: ItineraryFormValues = {
    ...emptyItineraryForm,
    leadId: searchParams.get("leadId") ?? "",
    customerId: searchParams.get("customerId") ?? "",
  };

  async function handleSubmit(values: ItineraryFormValues) {
    const { itinerary } = await apiFetch<{ itinerary: { id: string } }>("/api/itineraries", {
      method: "POST",
      body: JSON.stringify(values),
    });
    router.push(`/itineraries/${itinerary.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New itinerary</h1>
        <p className="text-sm text-slate-500">Draft manually or generate a first pass with AI.</p>
      </div>
      <ItineraryForm
        initial={initial}
        leads={leadsData?.leads ?? []}
        customers={customersData?.customers ?? []}
        onSubmit={handleSubmit}
        submitLabel="Create itinerary"
      />
    </div>
  );
}

export default function NewItineraryPage() {
  return (
    <Suspense>
      <NewItineraryInner />
    </Suspense>
  );
}
