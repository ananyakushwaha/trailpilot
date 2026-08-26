"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import { LeadForm, emptyLeadForm, type LeadFormValues } from "@/components/LeadForm";
import { apiFetch } from "@/lib/api-client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function NewLeadPage() {
  const router = useRouter();
  const { data } = useSWR<{ users: { id: string; name: string }[] }>("/api/users", fetcher);

  async function handleSubmit(values: LeadFormValues) {
    const { lead } = await apiFetch<{ lead: { id: string } }>("/api/leads", {
      method: "POST",
      body: JSON.stringify(values),
    });
    router.push(`/leads/${lead.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add lead</h1>
        <p className="text-sm text-slate-500">Capture an enquiry before it slips through.</p>
      </div>
      <LeadForm
        initial={emptyLeadForm}
        users={data?.users ?? []}
        onSubmit={handleSubmit}
        submitLabel="Create lead"
      />
    </div>
  );
}
