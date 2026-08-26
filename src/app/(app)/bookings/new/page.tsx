"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { apiFetch, ApiError } from "@/lib/api-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function NewBookingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: customersData } = useSWR<{ customers: { id: string; fullName: string }[] }>(
    "/api/customers",
    fetcher,
  );
  const { data: itinerariesData } = useSWR<{
    itineraries: { id: string; title: string; destination: string; numDays: number; numNights: number }[];
  }>("/api/itineraries", fetcher);

  const [form, setForm] = useState({
    customerId: searchParams.get("customerId") ?? "",
    leadId: searchParams.get("leadId") ?? "",
    itineraryId: searchParams.get("itineraryId") ?? "",
    destination: "",
    startDate: "",
    endDate: "",
    packageAmount: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function applyItinerary(itineraryId: string) {
    const itinerary = itinerariesData?.itineraries.find((i) => i.id === itineraryId);
    setForm((prev) => ({
      ...prev,
      itineraryId,
      destination: itinerary ? itinerary.destination : prev.destination,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { booking } = await apiFetch<{ booking: { id: string } }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">New booking</h1>
        <p className="text-sm text-slate-500">Move a confirmed trip from sales into operations.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Customer <span className="text-red-500">*</span>
          </span>
          <select
            required
            className="select"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
          >
            <option value="">Select customer</option>
            {customersData?.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Itinerary (optional)</span>
          <select
            className="select"
            value={form.itineraryId}
            onChange={(e) => applyItinerary(e.target.value)}
          >
            <option value="">None</option>
            {itinerariesData?.itineraries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} ({i.destination})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Destination <span className="text-red-500">*</span>
          </span>
          <input
            required
            className="input"
            value={form.destination}
            onChange={(e) => setForm({ ...form, destination: e.target.value })}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Start date <span className="text-red-500">*</span>
            </span>
            <input
              required
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              End date <span className="text-red-500">*</span>
            </span>
            <input
              required
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Package amount (₹) <span className="text-red-500">*</span>
          </span>
          <input
            required
            type="number"
            min={0}
            className="input"
            value={form.packageAmount}
            onChange={(e) => setForm({ ...form, packageAmount: e.target.value })}
          />
        </label>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Creating..." : "Create booking"}
        </button>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense>
      <NewBookingInner />
    </Suspense>
  );
}
