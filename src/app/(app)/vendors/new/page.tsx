"use client";

import { useRouter } from "next/navigation";
import { VendorForm, emptyVendorForm, type VendorFormValues } from "@/components/VendorForm";
import { apiFetch } from "@/lib/api-client";

export default function NewVendorPage() {
  const router = useRouter();

  async function handleSubmit(values: VendorFormValues) {
    const { vendor } = await apiFetch<{ vendor: { id: string } }>("/api/vendors", {
      method: "POST",
      body: JSON.stringify(values),
    });
    router.push(`/vendors/${vendor.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add vendor</h1>
        <p className="text-sm text-slate-500">Build a reusable partner directory.</p>
      </div>
      <VendorForm initial={emptyVendorForm} onSubmit={handleSubmit} submitLabel="Create vendor" />
    </div>
  );
}
