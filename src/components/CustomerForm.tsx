"use client";

import { useState } from "react";

export type CustomerFormValues = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  govIdType: string;
  govIdNumber: string;
  emergencyContact: string;
  foodPreference: string;
  hotelPreference: string;
  transportPreference: string;
  medicalNotes: string;
  internalNotes: string;
};

export const emptyCustomerForm: CustomerFormValues = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  govIdType: "",
  govIdNumber: "",
  emergencyContact: "",
  foodPreference: "",
  hotelPreference: "",
  transportPreference: "",
  medicalNotes: "",
  internalNotes: "",
};

export function customerToFormValues(customer: Record<string, unknown>): CustomerFormValues {
  return {
    fullName: (customer.fullName as string) ?? "",
    phone: (customer.phone as string) ?? "",
    email: (customer.email as string) ?? "",
    address: (customer.address as string) ?? "",
    govIdType: (customer.govIdType as string) ?? "",
    govIdNumber: (customer.govIdNumber as string) ?? "",
    emergencyContact: (customer.emergencyContact as string) ?? "",
    foodPreference: (customer.foodPreference as string) ?? "",
    hotelPreference: (customer.hotelPreference as string) ?? "",
    transportPreference: (customer.transportPreference as string) ?? "",
    medicalNotes: (customer.medicalNotes as string) ?? "",
    internalNotes: (customer.internalNotes as string) ?? "",
  };
}

export function CustomerForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
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
        <h2 className="text-sm font-semibold text-slate-900">Basic details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <input
              required
              className="input"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
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
          <Field label="Emergency contact">
            <input
              className="input"
              value={form.emergencyContact}
              onChange={(e) => update("emergencyContact", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Address">
          <textarea
            className="textarea"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
          />
        </Field>
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Identification</h2>
        <p className="text-xs text-slate-500">
          Stored for trip documentation only. Visible to agency staff, not shared externally.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ID type">
            <input
              className="input"
              value={form.govIdType}
              onChange={(e) => update("govIdType", e.target.value)}
              placeholder="Aadhaar, Passport..."
            />
          </Field>
          <Field label="ID number">
            <input
              className="input"
              value={form.govIdNumber}
              onChange={(e) => update("govIdNumber", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Preferences</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Food preference">
            <input
              className="input"
              value={form.foodPreference}
              onChange={(e) => update("foodPreference", e.target.value)}
            />
          </Field>
          <Field label="Hotel preference">
            <input
              className="input"
              value={form.hotelPreference}
              onChange={(e) => update("hotelPreference", e.target.value)}
            />
          </Field>
          <Field label="Transport preference">
            <input
              className="input"
              value={form.transportPreference}
              onChange={(e) => update("transportPreference", e.target.value)}
            />
          </Field>
          <Field label="Medical / accessibility notes">
            <input
              className="input"
              value={form.medicalNotes}
              onChange={(e) => update("medicalNotes", e.target.value)}
              placeholder="Only if voluntarily provided"
            />
          </Field>
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
