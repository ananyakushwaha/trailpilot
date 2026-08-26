export function isWhatsAppConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export type SendResult = { sent: boolean; error?: string };

// Sends a free-form WhatsApp text message via the Meta Cloud API. Falls back
// to a no-op (caller logs it) when credentials aren't configured, so the
// notification engine works end-to-end without a live WhatsApp Business account.
export async function sendWhatsAppMessage(to: string, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return { sent: false, error: "WhatsApp is not configured" };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace(/[^\d+]/g, ""),
          type: "text",
          text: { body },
        }),
      },
    );

    if (!response.ok) {
      return { sent: false, error: `WhatsApp API returned ${response.status}: ${await response.text()}` };
    }

    return { sent: true };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : "Unknown WhatsApp error" };
  }
}
