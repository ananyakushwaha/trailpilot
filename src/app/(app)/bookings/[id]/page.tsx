"use client";

import { use, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { BOOKING_STATUS_OPTIONS, BookingStatusBadge } from "@/components/BookingStatusBadge";
import { VendorCategoryBadge } from "@/components/VendorBadges";
import { SendMessageButtons } from "@/components/SendMessageButtons";
import { apiFetch, ApiError } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type BookingDetail = {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  packageAmount: number;
  status: string;
  internalNotes: string | null;
  customer: { id: string; fullName: string; phone: string; email: string | null };
  lead: { id: string; customerName: string } | null;
  itinerary: { id: string; title: string } | null;
  vendors: {
    id: string;
    agreedCost: number | null;
    advancePaid: number;
    notes: string | null;
    vendor: { id: string; name: string; category: string };
  }[];
  payments: {
    id: string;
    direction: string;
    amount: number;
    method: string;
    reference: string | null;
    paidAt: string;
    bookingVendorId: string | null;
  }[];
  checklist: { id: string; label: string; completed: boolean }[];
  feedback: { id: string; overallRating: number } | null;
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, mutate } = useSWR<{ booking: BookingDetail }>(
    `/api/bookings/${id}`,
    fetcher,
  );
  const { data: vendorsData } = useSWR<{ vendors: { id: string; name: string; category: string }[] }>(
    "/api/vendors",
    fetcher,
  );
  const { data: meData } = useSWR<{ agency: { name: string } | null }>("/api/auth/me", fetcher);

  const [statusSaving, setStatusSaving] = useState(false);
  const [vendorForm, setVendorForm] = useState({ vendorId: "", agreedCost: "", advancePaid: "", notes: "" });
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    direction: "CUSTOMER_IN",
    bookingVendorId: "",
    amount: "",
    method: "CASH",
    reference: "",
    note: "",
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  async function updateStatus(status: string) {
    setStatusSaving(true);
    try {
      await apiFetch(`/api/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      mutate();
    } finally {
      setStatusSaving(false);
    }
  }

  async function toggleChecklist(itemId: string, completed: boolean) {
    await apiFetch(`/api/bookings/${id}/checklist/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    mutate();
  }

  async function addVendor(e: React.FormEvent) {
    e.preventDefault();
    setVendorError(null);
    try {
      await apiFetch(`/api/bookings/${id}/vendors`, {
        method: "POST",
        body: JSON.stringify(vendorForm),
      });
      setVendorForm({ vendorId: "", agreedCost: "", advancePaid: "", notes: "" });
      mutate();
    } catch (err) {
      setVendorError(err instanceof ApiError ? err.message : "Could not assign vendor");
    }
  }

  async function removeVendor(bookingVendorId: string) {
    await apiFetch(`/api/bookings/${id}/vendors/${bookingVendorId}`, { method: "DELETE" });
    mutate();
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError(null);
    try {
      await apiFetch(`/api/bookings/${id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          ...paymentForm,
          bookingVendorId: paymentForm.direction === "VENDOR_OUT" ? paymentForm.bookingVendorId : null,
        }),
      });
      setPaymentForm({
        direction: "CUSTOMER_IN",
        bookingVendorId: "",
        amount: "",
        method: "CASH",
        reference: "",
        note: "",
      });
      mutate();
    } catch (err) {
      setPaymentError(err instanceof ApiError ? err.message : "Could not record payment");
    }
  }

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Loading booking...</p>;
  }

  const booking = data.booking;
  const collected = booking.payments
    .filter((p) => p.direction === "CUSTOMER_IN")
    .reduce((sum, p) => sum + p.amount, 0);
  const balance = booking.packageAmount - collected;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/bookings" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to bookings
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">
            {booking.customer.fullName} · {booking.destination}
          </h1>
          <p className="text-sm text-slate-500">
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <select
            className="select"
            value={booking.status}
            disabled={statusSaving}
            onChange={(e) => updateStatus(e.target.value)}
          >
            {BOOKING_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-xs font-medium text-slate-500">Package amount</p>
          <p className="text-lg font-semibold text-slate-900">
            ₹{booking.packageAmount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-slate-500">Collected</p>
          <p className="text-lg font-semibold text-emerald-600">
            ₹{collected.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="card">
          <p className="text-xs font-medium text-slate-500">Balance due</p>
          <p className={`text-lg font-semibold ${balance > 0 ? "text-amber-600" : "text-slate-900"}`}>
            ₹{Math.max(balance, 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="card flex flex-wrap gap-4 text-sm text-slate-600">
        {booking.itinerary && (
          <Link href={`/itineraries/${booking.itinerary.id}`} className="text-indigo-600 hover:text-indigo-500">
            View itinerary: {booking.itinerary.title}
          </Link>
        )}
        <Link href={`/customers/${booking.customer.id}`} className="text-indigo-600 hover:text-indigo-500">
          View customer profile
        </Link>
        <a href={`/api/bookings/${id}/invoice`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">
          Download invoice PDF
        </a>
        <PrintButton />
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Operational checklist</h2>
        <ul className="space-y-2">
          {booking.checklist.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => toggleChecklist(item.id, e.target.checked)}
              />
              <span className={item.completed ? "text-slate-400 line-through" : "text-slate-700"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Vendor assignment</h2>
        <ul className="divide-y divide-slate-100">
          {booking.vendors.map((bv) => (
            <li key={bv.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{bv.vendor.name}</span>
                  <VendorCategoryBadge category={bv.vendor.category} />
                </div>
                {bv.agreedCost != null && (
                  <p className="text-xs text-slate-500">
                    Cost ₹{bv.agreedCost.toLocaleString("en-IN")} · Advance ₹
                    {bv.advancePaid.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
              <button onClick={() => removeVendor(bv.id)} className="text-xs text-red-600 hover:text-red-700">
                Remove
              </button>
            </li>
          ))}
          {booking.vendors.length === 0 && (
            <li className="py-2 text-sm text-slate-500">No vendors assigned yet.</li>
          )}
        </ul>

        <form onSubmit={addVendor} className="grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
          <select
            required
            className="select"
            value={vendorForm.vendorId}
            onChange={(e) => setVendorForm({ ...vendorForm, vendorId: e.target.value })}
          >
            <option value="">Select vendor</option>
            {vendorsData?.vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Agreed cost"
            className="input"
            value={vendorForm.agreedCost}
            onChange={(e) => setVendorForm({ ...vendorForm, agreedCost: e.target.value })}
          />
          <input
            type="number"
            placeholder="Advance paid"
            className="input"
            value={vendorForm.advancePaid}
            onChange={(e) => setVendorForm({ ...vendorForm, advancePaid: e.target.value })}
          />
          <button type="submit" className="btn-secondary">
            Assign vendor
          </button>
        </form>
        {vendorError && <p className="text-sm text-red-700">{vendorError}</p>}
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Payments</h2>
        <ul className="divide-y divide-slate-100">
          {booking.payments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <span className={payment.direction === "CUSTOMER_IN" ? "text-emerald-700" : "text-red-700"}>
                  {payment.direction === "CUSTOMER_IN" ? "Received" : "Paid out"} ₹
                  {payment.amount.toLocaleString("en-IN")}
                </span>
                <p className="text-xs text-slate-500">
                  {payment.method} · {formatDate(payment.paidAt)}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </p>
              </div>
              {payment.direction === "CUSTOMER_IN" && (
                <a
                  href={`/api/payments/${payment.id}/receipt`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-500"
                >
                  Receipt
                </a>
              )}
            </li>
          ))}
          {booking.payments.length === 0 && (
            <li className="py-2 text-sm text-slate-500">No payments recorded yet.</li>
          )}
        </ul>

        <form onSubmit={addPayment} className="space-y-2 border-t border-slate-100 pt-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <select
              className="select"
              value={paymentForm.direction}
              onChange={(e) => setPaymentForm({ ...paymentForm, direction: e.target.value })}
            >
              <option value="CUSTOMER_IN">Customer payment in</option>
              <option value="VENDOR_OUT">Vendor payment out</option>
            </select>
            {paymentForm.direction === "VENDOR_OUT" && (
              <select
                className="select"
                value={paymentForm.bookingVendorId}
                onChange={(e) => setPaymentForm({ ...paymentForm, bookingVendorId: e.target.value })}
              >
                <option value="">Select vendor assignment</option>
                {booking.vendors.map((bv) => (
                  <option key={bv.id} value={bv.id}>
                    {bv.vendor.name}
                  </option>
                ))}
              </select>
            )}
            <input
              required
              type="number"
              placeholder="Amount"
              className="input"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            />
            <select
              className="select"
              value={paymentForm.method}
              onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              placeholder="Reference / UTR"
              className="input"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
            <input
              placeholder="Note"
              className="input sm:col-span-2"
              value={paymentForm.note}
              onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-secondary">
            Record payment
          </button>
        </form>
        {paymentError && <p className="text-sm text-red-700">{paymentError}</p>}
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Communication</h2>
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Booking confirmation</p>
          <SendMessageButtons
            templateKey="BOOKING_CONFIRMATION"
            recipientPhone={booking.customer.phone}
            recipientEmail={booking.customer.email}
            bookingId={id}
            variables={{
              customer_name: booking.customer.fullName,
              agency_name: meData?.agency?.name ?? "",
              trip_destination: booking.destination,
              start_date: formatDate(booking.startDate),
              end_date: formatDate(booking.endDate),
            }}
          />
        </div>
        {balance > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Payment reminder</p>
            <SendMessageButtons
              templateKey="PAYMENT_REMINDER"
              recipientPhone={booking.customer.phone}
              recipientEmail={booking.customer.email}
              bookingId={id}
              variables={{
                customer_name: booking.customer.fullName,
                agency_name: meData?.agency?.name ?? "",
                trip_destination: booking.destination,
                balance_amount: `₹${Math.max(balance, 0).toLocaleString("en-IN")}`,
              }}
            />
          </div>
        )}
        {booking.status === "COMPLETED" && (
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Trip completion message</p>
            <SendMessageButtons
              templateKey="TRIP_COMPLETION"
              recipientPhone={booking.customer.phone}
              recipientEmail={booking.customer.email}
              bookingId={id}
              variables={{
                customer_name: booking.customer.fullName,
                agency_name: meData?.agency?.name ?? "",
                trip_destination: booking.destination,
                feedback_link:
                  typeof window !== "undefined" ? `${window.location.origin}/feedback/${id}` : "",
              }}
            />
          </div>
        )}
      </div>

      {booking.status === "COMPLETED" && !booking.feedback && (
        <div className="card">
          <p className="text-sm text-slate-600">
            Trip completed. Share the feedback form so you can request a review.
          </p>
          <Link
            href={`/feedback/${booking.id}`}
            target="_blank"
            className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Open feedback form link →
          </Link>
        </div>
      )}
      {booking.feedback && (
        <div className="card">
          <p className="text-sm text-slate-700">
            Feedback collected — overall rating {booking.feedback.overallRating}/5.
          </p>
        </div>
      )}
    </div>
  );
}
