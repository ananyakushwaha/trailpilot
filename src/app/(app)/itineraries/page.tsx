"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

type Itinerary = {
  id: string;
  title: string;
  destination: string;
  numDays: number;
  numNights: number;
  status: string;
  isTemplate: boolean;
  lead: { id: string; customerName: string } | null;
  customer: { id: string; fullName: string } | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ItinerariesPage() {
  const [search, setSearch] = useState("");
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { data, isLoading } = useSWR<{ itineraries: Itinerary[] }>(
    `/api/itineraries?${params.toString()}`,
    fetcher,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Itineraries</h1>
          <p className="text-sm text-slate-500">Manual and AI-assisted day-wise plans.</p>
        </div>
        <Link href="/itineraries/new" className="btn-primary">
          New itinerary
        </Link>
      </div>

      <div className="card">
        <input
          className="input max-w-xs"
          placeholder="Search title or destination"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-slate-500">Loading itineraries...</p>}
        {!isLoading && data?.itineraries.length === 0 && (
          <p className="text-sm text-slate-500">No itineraries yet.</p>
        )}
        {data?.itineraries.map((itinerary) => (
          <Link
            key={itinerary.id}
            href={`/itineraries/${itinerary.id}`}
            className="card block hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-medium text-slate-900">{itinerary.title}</h2>
              {itinerary.isTemplate && (
                <span className="badge bg-purple-50 text-purple-700">Template</span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {itinerary.destination} · {itinerary.numDays}D/{itinerary.numNights}N
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {itinerary.customer?.fullName ?? itinerary.lead?.customerName ?? "No customer linked"}
            </p>
            <span
              className={`badge mt-3 ${
                itinerary.status === "FINAL"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {itinerary.status === "FINAL" ? "Final" : "Draft"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
