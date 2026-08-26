"use client";

import useSWR from "swr";
import { VendorCategoryBadge } from "@/components/VendorBadges";
import { formatDate } from "@/lib/format";

type AnalyticsData = {
  averageOverallRating: number | null;
  totalFeedbackCount: number;
  reviewsRequestedCount: number;
  complaintKeywords: { word: string; count: number }[];
  vendorWiseRatings: { name: string; category: string; averageRating: number | null; count: number }[];
  revenueByMonth: { month: string; total: number }[];
  recentComplaints: {
    id: string;
    customerName: string;
    destination: string;
    overallRating: number;
    whatCanImprove: string | null;
    createdAt: string;
  }[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AnalyticsPage() {
  const { data, isLoading } = useSWR<AnalyticsData>("/api/analytics", fetcher);

  const maxRevenue = Math.max(1, ...(data?.revenueByMonth.map((m) => m.total) ?? [1]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Customer satisfaction and revenue at a glance.</p>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading analytics...</p>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card">
              <p className="text-xs font-medium text-slate-500">Average trip rating</p>
              <p className="text-2xl font-semibold text-slate-900">
                {data.averageOverallRating != null ? `${data.averageOverallRating}/5` : "—"}
              </p>
              <p className="text-xs text-slate-400">{data.totalFeedbackCount} responses</p>
            </div>
            <div className="card">
              <p className="text-xs font-medium text-slate-500">Google reviews requested</p>
              <p className="text-2xl font-semibold text-slate-900">{data.reviewsRequestedCount}</p>
            </div>
            <div className="card">
              <p className="text-xs font-medium text-slate-500">Revenue this month</p>
              <p className="text-2xl font-semibold text-slate-900">
                ₹{(data.revenueByMonth.at(-1)?.total ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Revenue, last 6 months</h2>
            <div className="flex items-end gap-3" style={{ height: 140 }}>
              {data.revenueByMonth.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-indigo-500"
                    style={{ height: `${Math.max(4, (m.total / maxRevenue) * 110)}px` }}
                    title={`₹${m.total.toLocaleString("en-IN")}`}
                  />
                  <span className="text-xs text-slate-500">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Vendor-wise ratings</h2>
              {data.vendorWiseRatings.length === 0 && (
                <p className="text-sm text-slate-500">No vendor feedback yet.</p>
              )}
              <ul className="space-y-2">
                {data.vendorWiseRatings.map((v) => (
                  <li key={v.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{v.name}</span>
                      <VendorCategoryBadge category={v.category} />
                    </div>
                    <span className="text-slate-600">
                      {v.averageRating}/5 ({v.count})
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Common complaint keywords</h2>
              {data.complaintKeywords.length === 0 && (
                <p className="text-sm text-slate-500">Not enough feedback yet to spot patterns.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {data.complaintKeywords.map((k) => (
                  <span key={k.word} className="badge bg-amber-50 text-amber-700">
                    {k.word} ({k.count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent feedback and complaints</h2>
            {data.recentComplaints.length === 0 && (
              <p className="text-sm text-slate-500">No low ratings — nice work.</p>
            )}
            <ul className="divide-y divide-slate-100">
              {data.recentComplaints.map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {c.customerName} · {c.destination}
                    </span>
                    <span className="badge bg-red-50 text-red-700">{c.overallRating}/5</span>
                  </div>
                  {c.whatCanImprove && <p className="mt-1 text-slate-600">{c.whatCanImprove}</p>}
                  <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
