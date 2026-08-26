"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import { toDateInputValue } from "@/lib/format";
import type { ItineraryDayDraft } from "@/lib/ai";

export type ItineraryDayValues = {
  dayNumber: number;
  title: string;
  activities: string;
  pickupDropNotes: string;
  hotelStay: string;
  inclusions: string;
  exclusions: string;
  importantInstructions: string;
};

export type ItineraryFormValues = {
  title: string;
  destination: string;
  numDays: number;
  numNights: number;
  travelStartDate: string;
  travelEndDate: string;
  travellerCount: number;
  budgetCategory: string;
  hotelCategory: string;
  tripType: string;
  interests: string;
  transportMode: string;
  specialNotes: string;
  leadId: string;
  customerId: string;
  status: string;
  isTemplate: boolean;
  days: ItineraryDayValues[];
};

export const emptyItineraryForm: ItineraryFormValues = {
  title: "",
  destination: "",
  numDays: 3,
  numNights: 2,
  travelStartDate: "",
  travelEndDate: "",
  travellerCount: 2,
  budgetCategory: "",
  hotelCategory: "",
  tripType: "",
  interests: "",
  transportMode: "",
  specialNotes: "",
  leadId: "",
  customerId: "",
  status: "DRAFT",
  isTemplate: false,
  days: [],
};

function emptyDay(dayNumber: number): ItineraryDayValues {
  return {
    dayNumber,
    title: "",
    activities: "",
    pickupDropNotes: "",
    hotelStay: "",
    inclusions: "",
    exclusions: "",
    importantInstructions: "",
  };
}

export function itineraryToFormValues(itinerary: Record<string, unknown>): ItineraryFormValues {
  const days = (itinerary.days as Record<string, unknown>[] | undefined) ?? [];
  return {
    title: (itinerary.title as string) ?? "",
    destination: (itinerary.destination as string) ?? "",
    numDays: (itinerary.numDays as number) ?? 1,
    numNights: (itinerary.numNights as number) ?? 0,
    travelStartDate: toDateInputValue(itinerary.travelStartDate as string | null),
    travelEndDate: toDateInputValue(itinerary.travelEndDate as string | null),
    travellerCount: (itinerary.travellerCount as number) ?? 1,
    budgetCategory: (itinerary.budgetCategory as string) ?? "",
    hotelCategory: (itinerary.hotelCategory as string) ?? "",
    tripType: (itinerary.tripType as string) ?? "",
    interests: (itinerary.interests as string) ?? "",
    transportMode: (itinerary.transportMode as string) ?? "",
    specialNotes: (itinerary.specialNotes as string) ?? "",
    leadId: (itinerary.leadId as string) ?? "",
    customerId: (itinerary.customerId as string) ?? "",
    status: (itinerary.status as string) ?? "DRAFT",
    isTemplate: (itinerary.isTemplate as boolean) ?? false,
    days: days.map((day) => ({
      dayNumber: (day.dayNumber as number) ?? 1,
      title: (day.title as string) ?? "",
      activities: (day.activities as string) ?? "",
      pickupDropNotes: (day.pickupDropNotes as string) ?? "",
      hotelStay: (day.hotelStay as string) ?? "",
      inclusions: (day.inclusions as string) ?? "",
      exclusions: (day.exclusions as string) ?? "",
      importantInstructions: (day.importantInstructions as string) ?? "",
    })),
  };
}

export function ItineraryForm({
  initial,
  leads,
  customers,
  onSubmit,
  submitLabel,
}: {
  initial: ItineraryFormValues;
  leads: { id: string; customerName: string }[];
  customers: { id: string; fullName: string }[];
  onSubmit: (values: ItineraryFormValues) => Promise<void>;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  function update<K extends keyof ItineraryFormValues>(key: K, value: ItineraryFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateDay(index: number, patch: Partial<ItineraryDayValues>) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    }));
  }

  function syncDayCount() {
    setForm((prev) => {
      const target = Math.max(1, prev.numDays);
      const days = [...prev.days];
      while (days.length < target) days.push(emptyDay(days.length + 1));
      days.length = target;
      return { ...prev, days: days.map((day, i) => ({ ...day, dayNumber: i + 1 })) };
    });
  }

  async function handleGenerateDraft() {
    setAiNote(null);
    setGenerating(true);
    try {
      const result = await apiFetch<{ days: ItineraryDayDraft[]; usedAI: boolean }>(
        "/api/itineraries/ai-draft",
        {
          method: "POST",
          body: JSON.stringify({
            destination: form.destination,
            numDays: form.numDays,
            numNights: form.numNights,
            travellerCount: form.travellerCount,
            budgetCategory: form.budgetCategory,
            hotelCategory: form.hotelCategory,
            tripType: form.tripType,
            interests: form.interests,
            transportMode: form.transportMode,
            specialNotes: form.specialNotes,
          }),
        },
      );
      setForm((prev) => ({
        ...prev,
        days: result.days.map((day) => ({
          dayNumber: day.dayNumber,
          title: day.title,
          activities: day.activities,
          pickupDropNotes: day.pickupDropNotes ?? "",
          hotelStay: day.hotelStay ?? "",
          inclusions: day.inclusions ?? "",
          exclusions: day.exclusions ?? "",
          importantInstructions: day.importantInstructions ?? "",
        })),
      }));
      setAiNote(
        result.usedAI
          ? "Draft generated with AI. Review and edit every day before sending."
          : "No AI key configured — generated a starter template. Review and edit every day before sending.",
      );
    } catch (err) {
      setError(err instanceof ApiError && err.status === 402 ? "AI itinerary drafting is a Premium feature. Ask the owner to upgrade." : err instanceof ApiError ? err.message : "Could not generate a draft");
    } finally {
      setGenerating(false);
    }
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
        <h2 className="text-sm font-semibold text-slate-900">Trip brief</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" required>
            <input
              required
              className="input"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="5N/6D Manali - Kasol Family Trip"
            />
          </Field>
          <Field label="Destination" required>
            <input
              required
              className="input"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
            />
          </Field>
          <Field label="Number of days" required>
            <input
              type="number"
              min={1}
              className="input"
              value={form.numDays}
              onChange={(e) => update("numDays", Number(e.target.value))}
            />
          </Field>
          <Field label="Number of nights" required>
            <input
              type="number"
              min={0}
              className="input"
              value={form.numNights}
              onChange={(e) => update("numNights", Number(e.target.value))}
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
          <Field label="Number of travellers">
            <input
              type="number"
              min={1}
              className="input"
              value={form.travellerCount}
              onChange={(e) => update("travellerCount", Number(e.target.value))}
            />
          </Field>
          <Field label="Budget category">
            <input
              className="input"
              value={form.budgetCategory}
              onChange={(e) => update("budgetCategory", e.target.value)}
              placeholder="Budget, mid-range, luxury"
            />
          </Field>
          <Field label="Hotel category">
            <input
              className="input"
              value={form.hotelCategory}
              onChange={(e) => update("hotelCategory", e.target.value)}
              placeholder="3-star, 4-star..."
            />
          </Field>
          <Field label="Trip type">
            <input
              className="input"
              value={form.tripType}
              onChange={(e) => update("tripType", e.target.value)}
              placeholder="Honeymoon, family, adventure..."
            />
          </Field>
          <Field label="Interests">
            <input
              className="input"
              value={form.interests}
              onChange={(e) => update("interests", e.target.value)}
              placeholder="Snow, cafes, trekking..."
            />
          </Field>
          <Field label="Transport mode">
            <input
              className="input"
              value={form.transportMode}
              onChange={(e) => update("transportMode", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Special notes">
          <textarea
            className="textarea"
            value={form.specialNotes}
            onChange={(e) => update("specialNotes", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Link to lead (optional)">
            <select
              className="select"
              value={form.leadId}
              onChange={(e) => update("leadId", e.target.value)}
            >
              <option value="">None</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.customerName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Link to customer (optional)">
            <select
              className="select"
              value={form.customerId}
              onChange={(e) => update("customerId", e.target.value)}
            >
              <option value="">None</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <select className="select" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="FINAL">Final</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isTemplate}
              onChange={(e) => update("isTemplate", e.target.checked)}
            />
            Save as reusable template
          </label>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Day-wise plan</h2>
          <div className="flex gap-2">
            <button type="button" onClick={syncDayCount} className="btn-secondary">
              Match {form.numDays} day{form.numDays === 1 ? "" : "s"}
            </button>
            <button
              type="button"
              onClick={handleGenerateDraft}
              disabled={generating || !form.destination || !form.numDays}
              className="btn-primary"
            >
              {generating ? "Generating..." : "Generate AI draft"}
            </button>
          </div>
        </div>
        {aiNote && <p className="rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{aiNote}</p>}

        {form.days.length === 0 && (
          <p className="text-sm text-slate-500">
            No days yet. Click &ldquo;Match {form.numDays} day{form.numDays === 1 ? "" : "s"}&rdquo; or
            &ldquo;Generate AI draft&rdquo; to start.
          </p>
        )}

        <div className="space-y-4">
          {form.days.map((day, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-indigo-700">Day {day.dayNumber}</h3>
              <div className="space-y-3">
                <Field label="Day title">
                  <input
                    className="input"
                    value={day.title}
                    onChange={(e) => updateDay(index, { title: e.target.value })}
                  />
                </Field>
                <Field label="Activities">
                  <textarea
                    className="textarea"
                    value={day.activities}
                    onChange={(e) => updateDay(index, { activities: e.target.value })}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Hotel stay">
                    <input
                      className="input"
                      value={day.hotelStay}
                      onChange={(e) => updateDay(index, { hotelStay: e.target.value })}
                    />
                  </Field>
                  <Field label="Pickup / drop notes">
                    <input
                      className="input"
                      value={day.pickupDropNotes}
                      onChange={(e) => updateDay(index, { pickupDropNotes: e.target.value })}
                    />
                  </Field>
                  <Field label="Inclusions">
                    <input
                      className="input"
                      value={day.inclusions}
                      onChange={(e) => updateDay(index, { inclusions: e.target.value })}
                    />
                  </Field>
                  <Field label="Exclusions">
                    <input
                      className="input"
                      value={day.exclusions}
                      onChange={(e) => updateDay(index, { exclusions: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Important instructions">
                  <input
                    className="input"
                    value={day.importantInstructions}
                    onChange={(e) => updateDay(index, { importantInstructions: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
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
