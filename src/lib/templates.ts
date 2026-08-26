export const TEMPLATE_KEYS = [
  "LEAD_FOLLOW_UP",
  "ITINERARY_SHARED",
  "BOOKING_CONFIRMATION",
  "PAYMENT_REMINDER",
  "TRIP_COMPLETION",
  "FEEDBACK_REQUEST",
  "GOOGLE_REVIEW_REQUEST",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export const TEMPLATE_KEY_LABELS: Record<TemplateKey, string> = {
  LEAD_FOLLOW_UP: "Lead follow-up",
  ITINERARY_SHARED: "Itinerary shared",
  BOOKING_CONFIRMATION: "Booking confirmation",
  PAYMENT_REMINDER: "Payment reminder",
  TRIP_COMPLETION: "Trip completion",
  FEEDBACK_REQUEST: "Feedback request",
  GOOGLE_REVIEW_REQUEST: "Google review request",
};

// Default message bodies with {{variable}} placeholders. Agencies can
// override any of these per channel from Agency Settings — approved
// WhatsApp template text changes over time, so nothing is hardcoded
// into the send path itself.
export const DEFAULT_TEMPLATES: Record<TemplateKey, { subject?: string; body: string }> = {
  LEAD_FOLLOW_UP: {
    body: "Hi {{customer_name}}, this is {{agency_name}}. Following up on your {{trip_destination}} enquiry — happy to answer any questions and share a quote whenever you're ready.",
  },
  ITINERARY_SHARED: {
    subject: "Your {{trip_destination}} itinerary from {{agency_name}}",
    body: "Hi {{customer_name}}, here's your day-wise itinerary for {{trip_destination}}: {{itinerary_link}}. Let us know if you'd like any changes.",
  },
  BOOKING_CONFIRMATION: {
    subject: "Booking confirmed — {{trip_destination}}",
    body: "Hi {{customer_name}}, your trip to {{trip_destination}} is confirmed for {{start_date}} to {{end_date}}. We'll share pickup and hotel details closer to the date.",
  },
  PAYMENT_REMINDER: {
    subject: "Payment reminder — {{trip_destination}}",
    body: "Hi {{customer_name}}, a friendly reminder that {{balance_amount}} is pending for your {{trip_destination}} trip. Let us know if you have any questions.",
  },
  TRIP_COMPLETION: {
    subject: "Hope you enjoyed {{trip_destination}}!",
    body: "Hi {{customer_name}}, we hope you had a wonderful time in {{trip_destination}}! We'd love to hear about your experience: {{feedback_link}}",
  },
  FEEDBACK_REQUEST: {
    subject: "How was your trip to {{trip_destination}}?",
    body: "Hi {{customer_name}}, please share a quick rating of your {{trip_destination}} trip: {{feedback_link}}",
  },
  GOOGLE_REVIEW_REQUEST: {
    subject: "Would you recommend us?",
    body: "Thank you for the great feedback, {{customer_name}}! If you enjoyed your trip, a Google review would mean a lot to us: {{google_review_url}}",
  },
};

export function renderTemplate(body: string, variables: Record<string, string>) {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match);
}
