"use client";

import Link from "next/link";
import useSWR from "swr";
import { LeadStatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";

type DashboardData = {
  totalLeadsThisMonth: number;
  newLeadsToday: number;
  leadsPendingFollowUp: number;
  wonLeadsThisMonth: number;
  totalCustomers: number;
  confirmedBookingsThisMonth: number;
  paymentsPendingFromCustomers: number;
  vendorPaymentsPending: number;
  revenueCollectedThisMonth: number;
  averageCustomerRating: number | null;
  upcomingTrips: {
    id: string;
    destination: string;
    startDate: string;
    customer: { fullName: string };
  }[];
  recentLeads: {
    id: string;
    customerName: string;
    destination: string | null;
    status: string;
    createdAt: string;
  }[];
  recentFeedback: {
    id: string;
    customerName: string;
    destination: string;
    overallRating: number;
    createdAt: string;
  }[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardData>("/api/dashboard", fetcher);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">What needs your attention today.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="New leads today" value={data?.newLeadsToday} loading={isLoading} />
        <StatCard
          label="Total leads this month"
          value={data?.totalLeadsThisMonth}
          loading={isLoading}
        />
        <StatCard
          label="Pending follow-ups"
          value={data?.leadsPendingFollowUp}
          loading={isLoading}
          href="/leads?followUp=overdue"
          highlight
        />
        <StatCard label="Won this month" value={data?.wonLeadsThisMonth} loading={isLoading} />
        <StatCard
          label="Confirmed bookings this month"
          value={data?.confirmedBookingsThisMonth}
          loading={isLoading}
          href="/bookings"
        />
        <StatCard
          label="Payments pending"
          value={data?.paymentsPendingFromCustomers}
          loading={isLoading}
          href="/bookings"
          currency
          highlight
        />
        <StatCard
          label="Vendor payments pending"
          value={data?.vendorPaymentsPending}
          loading={isLoading}
          href="/bookings"
          currency
        />
        <StatCard
          label="Revenue collected this month"
          value={data?.revenueCollectedThisMonth}
          loading={isLoading}
          currency
        />
        <StatCard label="Total customers" value={data?.totalCustomers} loading={isLoading} />
        <StatCard
          label="Average customer rating"
          value={data?.averageCustomerRating ?? undefined}
          loading={isLoading}
          href="/analytics"
          suffix="/5"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent leads</h2>
            <Link href="/leads" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>

          {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
          {!isLoading && data?.recentLeads.length === 0 && (
            <p className="text-sm text-slate-500">
              No leads yet.{" "}
              <Link href="/leads/new" className="font-medium text-indigo-600">
                Add your first lead
              </Link>
              .
            </p>
          )}

          <ul className="divide-y divide-slate-100">
            {data?.recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {lead.customerName}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {lead.destination ?? "No destination"} · {formatDate(lead.createdAt)}
                  </p>
                </div>
                <LeadStatusBadge status={lead.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming trips (7 days)</h2>
            <Link href="/bookings" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          {!isLoading && data?.upcomingTrips.length === 0 && (
            <p className="text-sm text-slate-500">No trips starting in the next 7 days.</p>
          )}
          <ul className="divide-y divide-slate-100">
            {data?.upcomingTrips.map((trip) => (
              <li key={trip.id} className="flex items-center justify-between py-3">
                <div>
                  <Link
                    href={`/bookings/${trip.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {trip.customer.fullName}
                  </Link>
                  <p className="text-xs text-slate-500">{trip.destination}</p>
                </div>
                <span className="text-xs text-slate-500">{formatDate(trip.startDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Recent feedback and complaints</h2>
          <Link href="/analytics" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View analytics
          </Link>
        </div>
        {!isLoading && data?.recentFeedback.length === 0 && (
          <p className="text-sm text-slate-500">No feedback collected yet.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {data?.recentFeedback.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{f.customerName}</span>
                <p className="text-xs text-slate-500">
                  {f.destination} · {formatDate(f.createdAt)}
                </p>
              </div>
              <span
                className={`badge ${
                  f.overallRating >= 4
                    ? "bg-emerald-50 text-emerald-700"
                    : f.overallRating === 3
                      ? "bg-amber-50 text-amber-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                {f.overallRating}/5
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
  href,
  highlight,
  currency,
  suffix,
}: {
  label: string;
  value?: number;
  loading: boolean;
  href?: string;
  highlight?: boolean;
  currency?: boolean;
  suffix?: string;
}) {
  const displayValue = loading
    ? "—"
    : currency
      ? `₹${(value ?? 0).toLocaleString("en-IN")}`
      : `${value ?? 0}${suffix ?? ""}`;

  const content = (
    <div
      className={`card flex flex-col gap-1 transition-shadow ${
        href ? "cursor-pointer hover:shadow-md" : ""
      } ${highlight && (value ?? 0) > 0 ? "border-amber-300 bg-amber-50" : ""}`}
    >
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-2xl font-semibold text-slate-900">{displayValue}</span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
