export type ItineraryDayDraft = {
  dayNumber: number;
  title: string;
  activities: string;
  pickupDropNotes?: string;
  hotelStay?: string;
  inclusions?: string;
  exclusions?: string;
  importantInstructions?: string;
};

export type AiItineraryInput = {
  destination: string;
  numDays: number;
  numNights: number;
  travellerCount: number;
  budgetCategory?: string;
  hotelCategory?: string;
  tripType?: string;
  interests?: string;
  transportMode?: string;
  specialNotes?: string;
};

export type ItineraryDraftResult = {
  days: ItineraryDayDraft[];
  usedAI: boolean;
};

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

// AI-assisted first draft. Every generated field remains editable before the
// agency sends it on — the PRD is explicit that AI drafts, it doesn't decide.
export async function generateItineraryDraft(
  input: AiItineraryInput,
): Promise<ItineraryDraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { days: templateDraft(input), usedAI: false };
  }

  try {
    const days = await callAnthropic(input, apiKey);
    if (days.length > 0) {
      return { days, usedAI: true };
    }
  } catch (error) {
    console.error("AI itinerary draft failed, falling back to template:", error);
  }

  return { days: templateDraft(input), usedAI: false };
}

async function callAnthropic(
  input: AiItineraryInput,
  apiKey: string,
): Promise<ItineraryDayDraft[]> {
  const prompt = `You are a travel planner for an Indian tour operator. Draft a day-wise itinerary as JSON only, no prose outside the JSON.

Trip details:
- Destination: ${input.destination}
- Days / nights: ${input.numDays} days, ${input.numNights} nights
- Travellers: ${input.travellerCount}
- Budget category: ${input.budgetCategory || "not specified"}
- Hotel category: ${input.hotelCategory || "not specified"}
- Trip type: ${input.tripType || "not specified"}
- Interests: ${input.interests || "not specified"}
- Transport mode: ${input.transportMode || "not specified"}
- Special notes: ${input.specialNotes || "none"}

Return a JSON array with exactly ${input.numDays} objects, one per day, each with these keys:
dayNumber (number), title (short string), activities (multi-line string describing the day),
pickupDropNotes, hotelStay, inclusions, exclusions, importantInstructions (all strings, keep concise).
Respond with ONLY the JSON array, no markdown fences, no commentary.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? "";
  const jsonText = extractJsonArray(text);
  const parsed = JSON.parse(jsonText);

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON array");
  }

  return parsed.map((day, index) => ({
    dayNumber: Number(day.dayNumber) || index + 1,
    title: String(day.title || `Day ${index + 1}`),
    activities: String(day.activities || ""),
    pickupDropNotes: day.pickupDropNotes ? String(day.pickupDropNotes) : undefined,
    hotelStay: day.hotelStay ? String(day.hotelStay) : undefined,
    inclusions: day.inclusions ? String(day.inclusions) : undefined,
    exclusions: day.exclusions ? String(day.exclusions) : undefined,
    importantInstructions: day.importantInstructions ? String(day.importantInstructions) : undefined,
  }));
}

function extractJsonArray(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error("No JSON array found in AI response");
  }
  return candidate.slice(start, end + 1);
}

// Deterministic fallback so the itinerary builder always produces a usable
// first draft even with no AI key configured.
function templateDraft(input: AiItineraryInput): ItineraryDayDraft[] {
  const days: ItineraryDayDraft[] = [];
  for (let i = 1; i <= input.numDays; i++) {
    const isFirst = i === 1;
    const isLast = i === input.numDays;
    days.push({
      dayNumber: i,
      title: isFirst
        ? `Arrival in ${input.destination}`
        : isLast
          ? `Departure from ${input.destination}`
          : `${input.destination} sightseeing`,
      activities: isFirst
        ? `Pickup on arrival, transfer to hotel, check-in, evening leisure at ${input.destination}.`
        : isLast
          ? `Breakfast, check-out, transfer to departure point.`
          : `Full day of ${input.tripType ? input.tripType + " " : ""}activities around ${input.destination}${
              input.interests ? ` focused on ${input.interests}` : ""
            }.`,
      pickupDropNotes: isFirst ? "Pickup time to be confirmed with the driver." : undefined,
      hotelStay: !isLast ? input.hotelCategory || "Hotel to be assigned" : undefined,
      inclusions: "Breakfast, accommodation, transfers as per itinerary.",
      exclusions: "Personal expenses, optional activities, anything not mentioned in inclusions.",
      importantInstructions: isFirst
        ? "Carry a valid photo ID for hotel check-in."
        : undefined,
    });
  }
  return days;
}
