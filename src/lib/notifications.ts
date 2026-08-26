import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage, isWhatsAppConfigured } from "@/lib/whatsapp";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { DEFAULT_TEMPLATES, renderTemplate, type TemplateKey } from "@/lib/templates";
import { decryptSecret } from "@/lib/secrets";

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
  const agency = await prisma.agency.findUnique({ where: { id: input.agencyId }, select: { plan: true, whatsappAccessTokenEnc: true, whatsappPhoneNumberId: true, emailApiKeyEnc: true, emailFrom: true } });
  const whatsappConfig = { accessToken: decryptSecret(agency?.whatsappAccessTokenEnc ?? null), phoneNumberId: agency?.whatsappPhoneNumberId };
  const emailConfig = { apiKey: decryptSecret(agency?.emailApiKeyEnc ?? null), from: agency?.emailFrom };
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
  const renderedBody = `${renderTemplate(template.body, input.variables)}\n\nPowered by TrailPilot™`;
  const renderedSubject = template.subject
    ? renderTemplate(template.subject, input.variables)
    : undefined;

  let status: "SENT" | "FAILED" | "LOGGED_ONLY" = "LOGGED_ONLY";
  let errorMessage: string | undefined;

  if (input.channel === "WHATSAPP") {
    if (isWhatsAppConfigured(whatsappConfig)) {
      const result = await sendWhatsAppMessage(input.recipient, renderedBody, whatsappConfig);
      status = result.sent ? "SENT" : "FAILED";
      errorMessage = result.error;
    } else {
      console.log(`[TrailOS][WhatsApp:logged-only] to ${input.recipient}: ${renderedBody}`);
    }
  } else {
    if (isEmailConfigured(emailConfig)) {
      const emailBody = renderedBody.replaceAll("\n", "<br />");
      const result = await sendEmail(input.recipient, renderedSubject ?? "Message from your agency", emailBody, emailConfig);
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

type BookingAutomationEvent = "CONFIRMED" | "PAYMENT_RECEIVED" | "COMPLETED";

/**
 * Sends the customer-facing messages that are safe to trigger from a booking
 * event. The function is intentionally best-effort: a message failure must
 * never make a booking or payment API request fail.
 */
export async function triggerBookingAutomation(bookingId: string, event: BookingAutomationEvent) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        agency: true,
        payments: { select: { amount: true, direction: true } },
      },
    });
    if (booking?.agency && booking.agency.plan !== "PREMIUM") return;
    if (!booking?.customer.phone) return;

    const variables = {
      customer_name: booking.customer.fullName,
      agency_name: booking.agency.name,
      trip_destination: booking.destination,
      start_date: booking.startDate.toLocaleDateString("en-IN"),
      end_date: booking.endDate.toLocaleDateString("en-IN"),
      balance_amount: `₹${Math.max(
        booking.packageAmount - booking.payments
          .filter((payment) => payment.direction === "CUSTOMER_IN")
          .reduce((sum, payment) => sum + payment.amount, 0),
        0,
      ).toLocaleString("en-IN")}`,
      feedback_link: `${process.env.APP_URL || ""}/feedback/${booking.id}`,
      google_review_url: booking.agency.googleReviewUrl || "",
    };

    const templateKeys: Record<BookingAutomationEvent, TemplateKey[]> = {
      CONFIRMED: ["BOOKING_CONFIRMATION"],
      PAYMENT_RECEIVED: ["PAYMENT_REMINDER"],
      COMPLETED: ["TRIP_COMPLETION", "FEEDBACK_REQUEST"],
    };

    for (const templateKey of templateKeys[event]) {
      await sendNotification({
        agencyId: booking.agencyId,
        channel: "WHATSAPP",
        templateKey,
        recipient: booking.customer.phone,
        variables,
        bookingId: booking.id,
      });
    }
  } catch (error) {
    console.error("[TrailOS] booking automation failed", { bookingId, event, error });
  }
}
