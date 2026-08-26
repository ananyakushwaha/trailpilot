"use client";

import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { TemplateKey } from "@/lib/templates";

export function SendMessageButtons({
  templateKey,
  recipientPhone,
  recipientEmail,
  variables,
  bookingId,
  leadId,
}: {
  templateKey: TemplateKey;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  variables: Record<string, string>;
  bookingId?: string;
  leadId?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState<"WHATSAPP" | "EMAIL" | null>(null);

  async function send(channel: "WHATSAPP" | "EMAIL", recipient: string) {
    setSending(channel);
    setStatus(null);
    try {
      const { log } = await apiFetch<{ log: { status: string } }>("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify({ channel, templateKey, recipient, variables, bookingId, leadId }),
      });
      setStatus(
        log.status === "SENT"
          ? `Sent via ${channel === "WHATSAPP" ? "WhatsApp" : "email"}.`
          : log.status === "LOGGED_ONLY"
            ? `${channel === "WHATSAPP" ? "WhatsApp" : "Email"} isn't configured yet — logged the message instead of sending it.`
            : `Failed to send via ${channel === "WHATSAPP" ? "WhatsApp" : "email"}.`,
      );
    } catch (err) {
      setStatus(err instanceof ApiError ? err.message : "Could not send message");
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {recipientPhone && (
        <button
          type="button"
          onClick={() => send("WHATSAPP", recipientPhone)}
          disabled={sending !== null}
          className="btn-secondary"
        >
          {sending === "WHATSAPP" ? "Sending..." : "Send WhatsApp"}
        </button>
      )}
      {recipientEmail && (
        <button
          type="button"
          onClick={() => send("EMAIL", recipientEmail)}
          disabled={sending !== null}
          className="btn-secondary"
        >
          {sending === "EMAIL" ? "Sending..." : "Send email"}
        </button>
      )}
      {status && <span className="text-xs text-slate-500">{status}</span>}
    </div>
  );
}
