"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetch, ApiError } from "@/lib/api-client";
import { ROLE_LABELS, INVITABLE_STAFF_ROLES, AGENCY_ADMIN_ROLES } from "@/lib/roles";
import type { TemplateKey } from "@/lib/templates";

type Agency = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  googleReviewUrl: string | null;
  whatsappPhoneNumberId?: string | null;
  emailFrom?: string | null;
  whatsappConnected?: boolean;
  emailConnected?: boolean;
};

type Member = { id: string; name: string; email: string; role: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AgencySettingsPage() {
  const { data: meData } = useSWR<{ user: { name: string; email: string; role: string } }>("/api/auth/me", fetcher);
  const { data: agencyData, mutate: mutateAgency } = useSWR<{ agency: Agency }>(
    "/api/agency",
    fetcher,
  );
  const { data: usersData, mutate: mutateUsers } = useSWR<{ users: Member[] }>(
    "/api/users",
    fetcher,
  );

  const isAdmin = Boolean(
    meData?.user.role && AGENCY_ADMIN_ROLES.includes(meData.user.role as never),
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Agency settings</h1>
        <p className="text-sm text-slate-500">Your agency profile and team.</p>
      </div>

      {meData?.user && <ProfileForm user={meData.user} onSaved={() => window.location.reload()} />}

      {agencyData && (
        <AgencyProfileForm agency={agencyData.agency} readOnly={!isAdmin} onSaved={mutateAgency} />
      )}

      {agencyData && isAdmin && <IntegrationSettingsForm agency={agencyData.agency} onSaved={mutateAgency} />}

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Team members</h2>
        <ul className="divide-y divide-slate-100">
          {usersData?.users.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
              <span className="badge bg-slate-100 text-slate-700">
                {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] ?? member.role}
              </span>
            </li>
          ))}
        </ul>

        {isAdmin && <InviteMemberForm onCreated={mutateUsers} />}
      </div>

      {isAdmin && <MessageTemplatesEditor />}
    </div>
  );
}

function IntegrationSettingsForm({ agency, onSaved }: { agency: Agency; onSaved: () => void }) {
  const [form, setForm] = useState({ whatsappAccessToken: "", whatsappPhoneNumberId: agency.whatsappPhoneNumberId ?? "", emailApiKey: "", emailFrom: agency.emailFrom ?? "" });
  const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  async function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(null); setMessage(null); try { await apiFetch("/api/agency", { method: "PATCH", body: JSON.stringify(form) }); setMessage("Business integrations saved securely."); onSaved(); } catch (err) { setError(err instanceof ApiError ? err.message : "Could not save integrations"); } finally { setSaving(false); } }
  return <form onSubmit={handleSubmit} className="card space-y-4"><div><h2 className="text-sm font-semibold text-slate-900">Business integrations</h2><p className="text-xs text-slate-500">Each agency owner can connect their own WhatsApp Business number and email sender. Tokens are encrypted and never displayed after saving.</p></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-medium text-slate-700">WhatsApp access token</span><input type="password" className="input" value={form.whatsappAccessToken} onChange={(e) => setForm({ ...form, whatsappAccessToken: e.target.value })} placeholder={agency.whatsappConnected ? "Saved - enter only to replace" : "Paste Meta token"} /></label><label><span className="mb-1 block text-sm font-medium text-slate-700">WhatsApp phone number ID</span><input className="input" value={form.whatsappPhoneNumberId} onChange={(e) => setForm({ ...form, whatsappPhoneNumberId: e.target.value })} placeholder="From Meta WhatsApp API Setup" /></label><label><span className="mb-1 block text-sm font-medium text-slate-700">Resend API key</span><input type="password" className="input" value={form.emailApiKey} onChange={(e) => setForm({ ...form, emailApiKey: e.target.value })} placeholder={agency.emailConnected ? "Saved - enter only to replace" : "Paste Resend key"} /></label><label><span className="mb-1 block text-sm font-medium text-slate-700">Sender email</span><input type="text" className="input" value={form.emailFrom} onChange={(e) => setForm({ ...form, emailFrom: e.target.value })} placeholder="Travel Team <hello@yourdomain.com>" /></label></div>{error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}<button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving..." : "Save business integrations"}</button></form>;
}

function ProfileForm({ user, onSaved }: { user: { name: string; email: string }; onSaved: () => void }) {
  const [form, setForm] = useState({ name: user.name, email: user.email, currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null); setMessage(null);
    try { await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify(form) }); setMessage("Profile updated."); setTimeout(onSaved, 600); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Could not update profile"); }
    finally { setSaving(false); }
  }
  return <form onSubmit={handleSubmit} className="card space-y-4"><div><h2 className="text-sm font-semibold text-slate-900">Owner profile</h2><p className="text-xs text-slate-500">Update the name and login email shown to your team.</p></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-sm font-medium text-slate-700">Full name</span><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label><span className="mb-1 block text-sm font-medium text-slate-700">Login email</span><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label><label><span className="mb-1 block text-sm font-medium text-slate-700">Current password</span><input type="password" className="input" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></label><label><span className="mb-1 block text-sm font-medium text-slate-700">New password (optional)</span><input type="password" minLength={8} className="input" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></label></div>{error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}<button type="submit" disabled={saving} className="btn-secondary">{saving ? "Saving..." : "Save owner profile"}</button></form>;
}

function AgencyProfileForm({
  agency,
  readOnly,
  onSaved,
}: {
  agency: Agency;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: agency.name,
    phone: agency.phone ?? "",
    address: agency.address ?? "",
    city: agency.city ?? "",
    googleReviewUrl: agency.googleReviewUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/api/agency", { method: "PATCH", body: JSON.stringify(form) });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Agency profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Agency name</span>
          <input
            required
            disabled={readOnly}
            className="input disabled:bg-slate-50"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Phone</span>
          <input
            disabled={readOnly}
            className="input disabled:bg-slate-50"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">City</span>
          <input
            disabled={readOnly}
            className="input disabled:bg-slate-50"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Address</span>
          <input
            disabled={readOnly}
            className="input disabled:bg-slate-50"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">Google review link</span>
          <input
            disabled={readOnly}
            className="input disabled:bg-slate-50"
            value={form.googleReviewUrl}
            onChange={(e) => setForm({ ...form, googleReviewUrl: e.target.value })}
            placeholder="https://g.page/r/.../review"
          />
        </label>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!readOnly && (
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save agency profile"}
        </button>
      )}
    </form>
  );
}

function InviteMemberForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SALES_EXECUTIVE",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/api/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "SALES_EXECUTIVE" });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 pt-4">
      <h3 className="text-sm font-semibold text-slate-900">Add team member</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          placeholder="Name"
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="email"
          placeholder="Email"
          className="input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Temporary password"
          className="input"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          className="select"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {INVITABLE_STAFF_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={saving} className="btn-secondary">
        {saving ? "Adding..." : "Add team member"}
      </button>
    </form>
  );
}

type MessageTemplateRow = {
  key: TemplateKey;
  label: string;
  channel: "WHATSAPP" | "EMAIL";
  subject: string | null;
  body: string;
  isCustomized: boolean;
};

function MessageTemplatesEditor() {
  const { data, mutate } = useSWR<{ templates: MessageTemplateRow[] }>(
    "/api/message-templates",
    fetcher,
  );
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Message templates</h2>
        <p className="text-xs text-slate-500">
          Customize the WhatsApp and email text sent at each stage. Variables like{" "}
          <code>{"{{customer_name}}"}</code> are filled in automatically.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {data?.templates.map((template) => {
          const rowKey = `${template.key}-${template.channel}`;
          return (
            <div key={rowKey} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-900">{template.label}</span>
                  <span className="ml-2 badge bg-slate-100 text-slate-600">
                    {template.channel === "WHATSAPP" ? "WhatsApp" : "Email"}
                  </span>
                  {template.isCustomized && (
                    <span className="ml-2 badge bg-indigo-50 text-indigo-700">Customized</span>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  onClick={() => setEditing(editing === rowKey ? null : rowKey)}
                >
                  {editing === rowKey ? "Close" : "Edit"}
                </button>
              </div>
              {editing !== rowKey && <p className="mt-1 text-xs text-slate-500 line-clamp-1">{template.body}</p>}
              {editing === rowKey && (
                <TemplateEditForm
                  template={template}
                  onSaved={() => {
                    setEditing(null);
                    mutate();
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TemplateEditForm({
  template,
  onSaved,
}: {
  template: MessageTemplateRow;
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(template.subject ?? "");
  const [body, setBody] = useState(template.body);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await apiFetch("/api/message-templates", {
        method: "PUT",
        body: JSON.stringify({ key: template.key, channel: template.channel, subject, body }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      {template.channel === "EMAIL" && (
        <input
          className="input"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      )}
      <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} />
      {error && <p className="text-xs text-red-700">{error}</p>}
      <button type="button" onClick={handleSave} disabled={saving} className="btn-secondary">
        {saving ? "Saving..." : "Save template"}
      </button>
    </div>
  );
}
