"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  _count: { leads: number };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const params = new URLSearchParams();
  if (search) params.set("search", search);

  const { data, isLoading } = useSWR<{ customers: Customer[] }>(
    `/api/customers?${params.toString()}`,
    fetcher,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500">Reusable profiles for every traveller.</p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          Add customer
        </Link>
      </div>

      <div className="card">
        <input
          className="input max-w-xs"
          placeholder="Search name, phone or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Trips</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Loading customers...
                </td>
              </tr>
            )}
            {!isLoading && data?.customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No customers yet.
                </td>
              </tr>
            )}
            {data?.customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/customers/${customer.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {customer.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{customer.phone}</td>
                <td className="px-4 py-3 text-slate-600">{customer.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{customer._count.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
