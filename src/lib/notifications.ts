import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, isWhatsAppConfigured } from "@/lib/whatsapp";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { DEFAULT_TEMPLATES, renderTemplate, type TemplateKey } from "@/lib/templates";

export type SendNotificationInput = {
  agencyId: string;
  channel: "WHATSAPP" | "EMAIL";
  templateKey: TemplateKey;
  recipient: string;
  variables: Record<string, string>;
  bookingId?: string | null;
  leadId?: string | null;
};

export async function isChannelConfigured(channel: "WHATSAPP" | "EMAIL") {
  return channel === "WHATSAPP" ? isWhatsAppConfigured() : isEmailConfigured();
}

export async function sendNotification(input: SendNotificationInput) {
  const override = await prisma.messageTemplate.findUnique({
    where: {
      agencyId_key_channel: {
        agencyId: input.agencyId,
        key: input.templateKey,
        channel: input.channel,
      },
    },
  });

  const template = override ?? DEFAULT_TEMPLATES[input.templateKey];
  const renderedBody = renderTemplate(template.body, input.variables);
  const renderedSubject = template.subject
    ? renderTemplate(template.subject, input.variables)
    : undefined;

  let status: "SENT" | "FAILED" | "LOGGED_ONLY" = "LOGGED_ONLY";
  let errorMessage: string | undefined;

  if (input.channel === "WHATSAPP") {
    if (isWhatsAppConfigured()) {
      const result = await sendWhatsAppMessage(input.recipient, renderedBody);
      status = result.sent ? "SENT" : "FAILED";
      errorMessage = result.error;
    } else {
      console.log(`[TrailOS][WhatsApp:logged-only] to ${input.recipient}: ${renderedBody}`);
    }
  } else {
    if (isEmailConfigured()) {
      const result = await sendEmail(input.recipient, renderedSubject ?? "Message from your agency", renderedBody);
      status = result.sent ? "SENT" : "FAILED";
      errorMessage = result.error;
    } else {
      console.log(`[TrailOS][Email:logged-only] to ${input.recipient}: ${renderedSubject} — ${renderedBody}`);
    }
  }

  const log = await prisma.notificationLog.create({
    data: {
      agencyId: input.agencyId,
      bookingId: input.bookingId || null,
      leadId: input.leadId || null,
      channel: input.channel,
      templateKey: input.templateKey,
      recipient: input.recipient,
      status,
      renderedBody,
      errorMessage: errorMessage || null,
    },
  });

  return log;
}
