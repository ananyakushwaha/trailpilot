"use client";

import { useRouter } from "next/navigation";
import { CustomerForm, emptyCustomerForm, type CustomerFormValues } from "@/components/CustomerForm";
import { apiFetch } from "@/lib/api-client";

export default function NewCustomerPage() {
  const router = useRouter();

  async function handleSubmit(values: CustomerFormValues) {
    const { customer } = await apiFetch<{ customer: { id: string } }>("/api/customers", {
      method: "POST",
      body: JSON.stringify(values),
    });
    router.push(`/customers/${customer.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add customer</h1>
        <p className="text-sm text-slate-500">Build a reusable profile for repeat service.</p>
      </div>
      <CustomerForm initial={emptyCustomerForm} onSubmit={handleSubmit} submitLabel="Create customer" />
    </div>
  );
}
