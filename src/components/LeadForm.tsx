"use client";

import { useState } from "react";
import { LEAD_SOURCE_OPTIONS, LEAD_STATUS_OPTIONS } from "@/components/StatusBadge";
import { toDateInputValue } from "@/lib/format";

export type LeadFormValues = {
  customerName: string;
  phone: string;
  email: string;
  destination: string;
  travelStartDate: string;
  travelEndDate: string;
  adults: number;
  children: number;
  budgetRange: string;
  hotelPreference: string;
  transportRequirement: string;
  source: string;
  status: string;
  assignedToId: string;
  nextFollowUpDate: string;
  internalNotes: string;
  lostReason: string;
};

export const emptyLeadForm: LeadFormValues = {
  customerName: "",
  phone: "",
  email: "",
  destination: "",
  travelStartDate: "",
  travelEndDate: "",
  adults: 1,
  children: 0,
  budgetRange: "",
  hotelPreference: "",
  transportRequirement: "",
  source: "OTHER",
  status: "NEW",
  assignedToId: "",
  nextFollowUpDate: "",
  internalNotes: "",
  lostReason: "",
};

export function leadToFormValues(lead: Record<string, unknown>): LeadFormValues {
  return {
    customerName: (lead.customerName as string) ?? "",
    phone: (lead.phone as string) ?? "",
    email: (lead.email as string) ?? "",
    destination: (lead.destination as string) ?? "",
    travelStartDate: toDateInputValue(lead.travelStartDate as string | null),
    travelEndDate: toDateInputValue(lead.travelEndDate as string | null),
    adults: (lead.adults as number) ?? 1,
    children: (lead.children as number) ?? 0,
    budgetRange: (lead.budgetRange as string) ?? "",
    hotelPreference: (lead.hotelPreference as string) ?? "",
    transportRequirement: (lead.transportRequirement as string) ?? "",
    source: (lead.source as string) ?? "OTHER",
    status: (lead.status as string) ?? "NEW",
    assignedToId: (lead.assignedToId as string) ?? "",
    nextFollowUpDate: toDateInputValue(lead.nextFollowUpDate as string | null),
    internalNotes: (lead.internalNotes as string) ?? "",
    lostReason: (lead.lostReason as string) ?? "",
  };
}

export function LeadForm({
  initial,
  users,
  onSubmit,
  submitLabel,
}: {
  initial: LeadFormValues;
  users: { id: string; name: string }[];
  onSubmit: (values: LeadFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Customer details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer name" required>
            <input
              required
              className="input"
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
            />
          </Field>
          <Field label="Phone" required>
            <input
              required
              className="input"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </Field>
          <Field label="Lead source">
            <select
              className="select"
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
            >
              {LEAD_SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Trip requirements</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Destination">
            <input
              className="input"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
              placeholder="Manali, Kasol..."
            />
          </Field>
          <Field label="Budget range">
            <input
              className="input"
              value={form.budgetRange}
              onChange={(e) => update("budgetRange", e.target.value)}
              placeholder="₹20,000 - ₹30,000 per head"
            />
          </Field>
          <Field label="Travel start date">
            <input
              type="date"
              className="input"
              value={form.travelStartDate}
              onChange={(e) => update("travelStartDate", e.target.value)}
            />
          </Field>
          <Field label="Travel end date">
            <input
              type="date"
              className="input"
              value={form.travelEndDate}
              onChange={(e) => update("travelEndDate", e.target.value)}
            />
          </Field>
          <Field label="Adults">
            <input
              type="number"
              min={1}
              className="input"
              value={form.adults}
              onChange={(e) => update("adults", Number(e.target.value))}
            />
          </Field>
          <Field label="Children">
            <input
              type="number"
              min={0}
              className="input"
              value={form.children}
              onChange={(e) => update("children", Number(e.target.value))}
            />
          </Field>
          <Field label="Hotel preference">
            <input
              className="input"
              value={form.hotelPreference}
              onChange={(e) => update("hotelPreference", e.target.value)}
            />
          </Field>
          <Field label="Transport requirement">
            <input
              className="input"
              value={form.transportRequirement}
              onChange={(e) => update("transportRequirement", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Pipeline</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <select
              className="select"
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
            >
              {LEAD_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned sales executive">
            <select
              className="select"
              value={form.assignedToId}
              onChange={(e) => update("assignedToId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Next follow-up date">
            <input
              type="date"
              className="input"
              value={form.nextFollowUpDate}
              onChange={(e) => update("nextFollowUpDate", e.target.value)}
            />
          </Field>
          {form.status === "LOST" && (
            <Field label="Lost reason">
              <input
                className="input"
                value={form.lostReason}
                onChange={(e) => update("lostReason", e.target.value)}
                placeholder="Pricing, response time, offering..."
              />
            </Field>
          )}
        </div>
        <Field label="Internal notes">
          <textarea
            className="textarea"
            value={form.internalNotes}
            onChange={(e) => update("internalNotes", e.target.value)}
          />
        </Field>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
