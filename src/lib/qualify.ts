import type { Temperature } from "./types";

export interface Qualification {
  jobType: string | null;
  urgency: "EMERGENCY" | "THIS_WEEK" | "FLEXIBLE" | null;
  location: string | null;
  budget: string | null;
  temperature: Temperature;
  summary: string;
}

const JOB_TYPE_KEYWORDS: Record<string, string[]> = {
  Roofing: ["roof", "shingle", "gutter", "flashing"],
  Plumbing: ["plumb", "pipe", "drain", "water heater", "faucet", "toilet", "leak"],
  HVAC: ["hvac", "furnace", "air condition", " ac ", "a/c", "heat pump", "heating", "no heat", "no ac"],
  Electrical: ["electric", "wiring", "breaker", "outlet", "panel upgrade"],
  Landscaping: ["lawn", "landscap", "tree removal", "mow", "sprinkler", "sod"],
};

const EMERGENCY_KEYWORDS = [
  "emergency",
  "asap",
  "urgent",
  "right now",
  "today",
  "flooding",
  "flooded",
  "no heat",
  "no ac",
  "no a/c",
  "burst",
  "sparking",
  "leaking badly",
];

const THIS_WEEK_KEYWORDS = ["this week", "soon", "few days", "tomorrow"];

const COLD_KEYWORDS = ["just looking", "just curious", "someday", "eventually", "next month", "no rush", "just a quote"];

const BUDGET_REGEX = /\$\s?[\d,]+(?:\.\d+)?(?:\s?-\s?\$?\s?[\d,]+)?/;

const LOCATION_REGEX = /\b(?:in|near|at)\s+([A-Z][a-zA-Z.\-]*(?:\s[A-Z][a-zA-Z.\-]*){0,2})\b/;
const ZIP_REGEX = /\b\d{5}\b/;

function detectJobType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(JOB_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return type;
  }
  return null;
}

function detectUrgency(text: string): Qualification["urgency"] {
  const lower = text.toLowerCase();
  if (EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))) return "EMERGENCY";
  if (COLD_KEYWORDS.some((kw) => lower.includes(kw))) return "FLEXIBLE";
  if (THIS_WEEK_KEYWORDS.some((kw) => lower.includes(kw))) return "THIS_WEEK";
  return null;
}

function detectLocation(text: string): string | null {
  const zip = text.match(ZIP_REGEX);
  if (zip) return zip[0];
  const match = text.match(LOCATION_REGEX);
  return match ? match[1] : null;
}

function detectBudget(text: string): string | null {
  const match = text.match(BUDGET_REGEX);
  return match ? match[0] : null;
}

function scoreTemperature(urgency: Qualification["urgency"], hasJobType: boolean): Temperature {
  if (urgency === "EMERGENCY") return "HOT";
  if (urgency === "THIS_WEEK") return "HOT";
  if (urgency === "FLEXIBLE") return "COLD";
  return hasJobType ? "WARM" : "COLD";
}

/**
 * Rule-based lead qualification from raw SMS text. Runs against the full
 * conversation transcript so far so later replies refine earlier guesses.
 * Deliberately dependency-free (no external LLM call required) so lead
 * capture keeps working even without an AI provider configured.
 */
export function qualifyLead(conversationText: string): Qualification {
  const jobType = detectJobType(conversationText);
  const urgency = detectUrgency(conversationText);
  const location = detectLocation(conversationText);
  const budget = detectBudget(conversationText);
  const temperature = scoreTemperature(urgency, Boolean(jobType));

  const parts: string[] = [];
  parts.push(jobType ? `${jobType} job` : "Job type not yet identified");
  if (urgency === "EMERGENCY") parts.push("emergency / needs immediate attention");
  else if (urgency === "THIS_WEEK") parts.push("wants service this week");
  else if (urgency === "FLEXIBLE") parts.push("flexible timeline / early-stage");
  if (location) parts.push(`located near ${location}`);
  if (budget) parts.push(`budget mentioned: ${budget}`);
  parts.push(`${temperature.toLowerCase()} lead`);

  return { jobType, urgency, location, budget, temperature, summary: parts.join(", ") };
}

interface QualifiableLead {
  jobType?: string | null;
  urgency?: string | null;
  location?: string | null;
}

/**
 * Drives the SMS qualification conversation one question at a time,
 * asking only for whatever field is still missing so the exchange reads
 * like a person, not a form.
 */
export function nextQualifyingQuestion(lead: QualifiableLead): string {
  if (!lead.jobType) return "Got it! What kind of job do you need help with?";
  if (!lead.urgency) return "Thanks — how urgent is this? Today, this week, or no rush?";
  if (!lead.location) return "Perfect, and what's the property address or zip code?";
  return "Great, I've got everything I need. Want me to text you a couple available times to get this booked?";
}
