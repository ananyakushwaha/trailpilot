"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { VENDOR_CATEGORY_OPTIONS, VendorCategoryBadge } from "@/components/VendorBadges";

type Vendor = {
  id: string;
  name: string;
  category: string;
  location: string | null;
  phone: string | null;
  rating: number | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);

  const { data, isLoading } = useSWR<{ vendors: Vendor[] }>(
    `/api/vendors?${params.toString()}`,
    fetcher,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Vendors</h1>
          <p className="text-sm text-slate-500">Hotels, drivers, guides and activity partners.</p>
        </div>
        <Link href="/vendors/new" className="btn-primary">
          Add vendor
        </Link>
      </div>

      <div className="card flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search name, location, contact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select max-w-xs"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {VENDOR_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading vendors...
                </td>
              </tr>
            )}
            {!isLoading && data?.vendors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No vendors yet.
                </td>
              </tr>
            )}
            {data?.vendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {vendor.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <VendorCategoryBadge category={vendor.category} />
                </td>
                <td className="px-4 py-3 text-slate-600">{vendor.location ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{vendor.phone ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{vendor.rating ? `${vendor.rating}/5` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
