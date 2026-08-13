export interface ContentIdeaDraft {
  platform: "Instagram Reels" | "Facebook" | "Google Business Profile";
  hook: string;
  caption: string;
  cta: string;
}

const TEMPLATES: Record<string, ContentIdeaDraft[]> = {
  Roofing: [
    {
      platform: "Instagram Reels",
      hook: "POV: you find out your roof has been leaking for months and didn't know it",
      caption:
        "Most roof damage hides until it's expensive. Here are the 3 warning signs we look for on every {city} inspection — swipe through before your next storm.",
      cta: "Book a free roof inspection — link in bio.",
    },
    {
      platform: "Facebook",
      hook: "Before & after: full roof replacement in {city}",
      caption:
        "From worn shingles to a roof this homeowner will trust for the next 30 years. Financing available, most estimates same-week.",
      cta: "Comment 'ROOF' and we'll send you a free quote.",
    },
    {
      platform: "Google Business Profile",
      hook: "Storm season checklist for {city} homeowners",
      caption: "5-point roof check every homeowner should do after a storm — and when to call a pro instead of a ladder.",
      cta: "Call now for a same-week inspection.",
    },
  ],
  Plumbing: [
    {
      platform: "Instagram Reels",
      hook: "The $9 fix that saves you a $2,000 water heater",
      caption: "Most water heater failures are preventable. Here's the 30-second check we do on every service call in {city}.",
      cta: "DM us 'CHECK' for a free video walkthrough.",
    },
    {
      platform: "Facebook",
      hook: "Why your drain keeps clogging (it's not what you think)",
      caption: "We snake dozens of {city} drains a month — the real culprit is almost never what homeowners expect.",
      cta: "Book a drain inspection this week.",
    },
    {
      platform: "Google Business Profile",
      hook: "24/7 emergency plumbing in {city}",
      caption: "Burst pipe? No hot water? We answer calls day or night and can usually be on-site same day.",
      cta: "Call now — we answer 24/7.",
    },
  ],
  HVAC: [
    {
      platform: "Instagram Reels",
      hook: "Your AC is working overtime and you don't even know it",
      caption: "3 signs your {city} home's HVAC system is losing efficiency — #2 is on almost every unit we inspect.",
      cta: "Book a free system checkup — link in bio.",
    },
    {
      platform: "Facebook",
      hook: "Beat the heat: HVAC tune-up special this month",
      caption: "A quick seasonal tune-up can cut your energy bill and prevent a mid-summer breakdown in {city}.",
      cta: "Comment 'COOL' for pricing.",
    },
    {
      platform: "Google Business Profile",
      hook: "No AC? Same-day service in {city}",
      caption: "Same-day diagnostics and repair for AC and furnace emergencies — licensed, insured, local.",
      cta: "Call now for same-day service.",
    },
  ],
  Electrical: [
    {
      platform: "Instagram Reels",
      hook: "Signs your home's wiring is a fire risk",
      caption: "Flickering lights, warm outlets, tripping breakers — here's what's normal and what needs a licensed electrician in {city}.",
      cta: "Book a free safety inspection.",
    },
    {
      platform: "Facebook",
      hook: "EV charger installs are booking up fast in {city}",
      caption: "We're installing Level 2 chargers weekly. Most jobs done in a single day.",
      cta: "Message us for a free quote.",
    },
    {
      platform: "Google Business Profile",
      hook: "Licensed electricians serving {city}",
      caption: "Panel upgrades, rewiring, and emergency repairs — fully licensed and insured.",
      cta: "Call now for a free estimate.",
    },
  ],
  Landscaping: [
    {
      platform: "Instagram Reels",
      hook: "This {city} backyard transformation took one weekend",
      caption: "Full before/after of a weekend landscaping refresh — sod, mulch beds, and a new paver path.",
      cta: "DM us for a free design consult.",
    },
    {
      platform: "Facebook",
      hook: "Fall cleanup slots filling up in {city}",
      caption: "Leaf removal, bed cleanup, and winterizing your sprinkler system — book before the first frost.",
      cta: "Comment 'CLEANUP' to reserve your spot.",
    },
    {
      platform: "Google Business Profile",
      hook: "Weekly lawn care in {city}",
      caption: "Reliable weekly mowing, edging, and seasonal cleanups for {city} homeowners.",
      cta: "Call now for a free quote.",
    },
  ],
};

const DEFAULT_SERVICE = "Roofing";

/**
 * Produces this week's content ideas for the business's service line. Uses a
 * curated template bank (tuned per trade) rather than an LLM call so it
 * works out of the box with zero external dependencies; swap in an LLM call
 * behind this same signature later without touching callers.
 */
export function generateWeeklyContentIdeas(serviceType: string, city: string): ContentIdeaDraft[] {
  const bank = TEMPLATES[serviceType] ?? TEMPLATES[DEFAULT_SERVICE];
  return bank.map((idea) => ({
    ...idea,
    hook: idea.hook.replaceAll("{city}", city),
    caption: idea.caption.replaceAll("{city}", city),
  }));
}
