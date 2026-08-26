"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { BOOKING_STATUS_OPTIONS, BookingStatusBadge } from "@/components/BookingStatusBadge";
import { formatDate } from "@/lib/format";

type Booking = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  packageAmount: number;
  status: string;
  customer: { fullName: string; phone: string };
  payments: { amount: number; direction: string }[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BookingsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (search) params.set("search", search);

  const { data, isLoading } = useSWR<{ bookings: Booking[] }>(
    `/api/bookings?${params.toString()}`,
    fetcher,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bookings</h1>
          <p className="text-sm text-slate-500">Confirmed trips, from advance to trip completion.</p>
        </div>
        <Link href="/bookings/new" className="btn-primary">
          New booking
        </Link>
      </div>

      <div className="card flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search destination or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {BOOKING_STATUS_OPTIONS.map((opt) => (
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
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Loading bookings...
                </td>
              </tr>
            )}
            {!isLoading && data?.bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No bookings yet.
                </td>
              </tr>
            )}
            {data?.bookings.map((booking) => {
              const collected = booking.payments
                .filter((p) => p.direction === "CUSTOMER_IN")
                .reduce((sum, p) => sum + p.amount, 0);
              const balance = booking.packageAmount - collected;
              return (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="font-medium text-slate-900 hover:text-indigo-600"
                    >
                      {booking.customer.fullName}
                    </Link>
                    <p className="text-xs text-slate-500">{booking.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{booking.destination}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {balance > 0 ? `₹${balance.toLocaleString("en-IN")} due` : "Paid"}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
