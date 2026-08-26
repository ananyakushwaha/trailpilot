export type EmailConfig = { apiKey?: string | null; from?: string | null };

export function isEmailConfigured(config?: EmailConfig) {
  return Boolean(config?.apiKey ?? process.env.RESEND_API_KEY);
}

export type SendResult = { sent: boolean; error?: string };

// Sends email via the Resend REST API. Falls back to a no-op (caller logs
// it) when no API key is configured.
export async function sendEmail(to: string, subject: string, html: string, config?: EmailConfig): Promise<SendResult> {
  const apiKey = config?.apiKey ?? process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, error: "Email is not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: config?.from || process.env.RESEND_FROM_EMAIL || "TrailOS <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      return { sent: false, error: `Resend API returned ${response.status}: ${await response.text()}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "Unknown email error" };
  }
}
