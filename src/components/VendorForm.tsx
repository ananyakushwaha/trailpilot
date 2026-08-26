"use client";

import { useState } from "react";
import { VENDOR_CATEGORY_OPTIONS } from "@/components/VendorBadges";

export type VendorFormValues = {
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  priceRangeNotes: string;
  gstDetails: string;
  rating: string;
  paymentTerms: string;
  availabilityNotes: string;
  internalComments: string;
};

export const emptyVendorForm: VendorFormValues = {
  name: "",
  category: "HOTEL",
  contactPerson: "",
  phone: "",
  email: "",
  location: "",
  priceRangeNotes: "",
  gstDetails: "",
  rating: "",
  paymentTerms: "",
  availabilityNotes: "",
  internalComments: "",
};

export function vendorToFormValues(vendor: Record<string, unknown>): VendorFormValues {
  return {
    name: (vendor.name as string) ?? "",
    category: (vendor.category as string) ?? "HOTEL",
    contactPerson: (vendor.contactPerson as string) ?? "",
    phone: (vendor.phone as string) ?? "",
    email: (vendor.email as string) ?? "",
    location: (vendor.location as string) ?? "",
    priceRangeNotes: (vendor.priceRangeNotes as string) ?? "",
    gstDetails: (vendor.gstDetails as string) ?? "",
    rating: vendor.rating != null ? String(vendor.rating) : "",
    paymentTerms: (vendor.paymentTerms as string) ?? "",
    availabilityNotes: (vendor.availabilityNotes as string) ?? "",
    internalComments: (vendor.internalComments as string) ?? "",
  };
}

export function VendorForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: VendorFormValues;
  onSubmit: (values: VendorFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof VendorFormValues>(key: K, value: VendorFormValues[K]) {
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
        <h2 className="text-sm font-semibold text-slate-900">Vendor details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vendor name" required>
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field label="Category" required>
            <select
              className="select"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              {VENDOR_CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Contact person">
            <input
              className="input"
              value={form.contactPerson}
              onChange={(e) => update("contactPerson", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
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
          <Field label="Location">
            <input
              className="input"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </Field>
          <Field label="Rating (1-5)">
            <input
              type="number"
              min={1}
              max={5}
              className="input"
              value={form.rating}
              onChange={(e) => update("rating", e.target.value)}
            />
          </Field>
          <Field label="Payment terms">
            <input
              className="input"
              value={form.paymentTerms}
              onChange={(e) => update("paymentTerms", e.target.value)}
              placeholder="50% advance, balance on arrival"
            />
          </Field>
        </div>
        <Field label="Price range / rate card notes">
          <textarea
            className="textarea"
            value={form.priceRangeNotes}
            onChange={(e) => update("priceRangeNotes", e.target.value)}
          />
        </Field>
        <Field label="GST / billing details">
          <input
            className="input"
            value={form.gstDetails}
            onChange={(e) => update("gstDetails", e.target.value)}
          />
        </Field>
        <Field label="Availability notes">
          <textarea
            className="textarea"
            value={form.availabilityNotes}
            onChange={(e) => update("availabilityNotes", e.target.value)}
          />
        </Field>
        <Field label="Internal comments">
          <textarea
            className="textarea"
            value={form.internalComments}
            onChange={(e) => update("internalComments", e.target.value)}
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
