"use client";

import { use } from "react";
import Link from "next/link";
import useSWR from "swr";
import { VendorForm, vendorToFormValues, type VendorFormValues } from "@/components/VendorForm";
import { apiFetch } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type VendorDetail = Record<string, unknown> & {
  id: string;
  name: string;
  bookingVendors: {
    id: string;
    agreedCost: number | null;
    booking: { id: string; destination: string; startDate: string; status: string };
  }[];
};

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, mutate } = useSWR<{ vendor: VendorDetail }>(
    `/api/vendors/${id}`,
    fetcher,
  );

  async function handleSubmit(values: VendorFormValues) {
    await apiFetch(`/api/vendors/${id}`, { method: "PATCH", body: JSON.stringify(values) });
    mutate();
  }

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading vendor...</p>;
  }

  const vendor = data.vendor;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/vendors" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to vendors
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{vendor.name}</h1>
      </div>

      {vendor.bookingVendors.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent bookings</h2>
          <ul className="divide-y divide-slate-100">
            {vendor.bookingVendors.map((bv) => (
              <li key={bv.id} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href={`/bookings/${bv.booking.id}`}
                  className="font-medium text-slate-900 hover:text-indigo-600"
                >
                  {bv.booking.destination}
                </Link>
                <span className="text-slate-500">{formatDate(bv.booking.startDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <VendorForm
        initial={vendorToFormValues(vendor)}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
