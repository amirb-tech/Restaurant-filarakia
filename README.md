# AI Growth Assistant

An AI-powered business assistant for local service businesses (roofers, plumbers, HVAC, landscaping, electricians) that captures every lead, follows up instantly, books qualified appointments, nurtures leads until they convert, and keeps a content calendar full.

## Core outcomes

1. **Capture every lead** — missed calls trigger an instant apology SMS instead of a voicemail nobody checks.
2. **Instant SMS follow-up** — smart nurture sequences at 1hr / 24hr / 3 days if a lead goes quiet.
3. **AI lead qualification** — job type, urgency, location, and budget are extracted from the SMS conversation and used to tag leads hot / warm / cold.
4. **Booking automation** — available slots (synced with Google Calendar) are offered by text and auto-confirmed, with 24hr and 2hr reminders.
5. **Content ideation** — weekly Reels / Facebook / Google Business Profile ideas tailored to the business's trade and city.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (swap the datasource for Postgres in production)
- Twilio (SMS + voice webhooks)
- Google Calendar API (OAuth, freebusy + event creation)

Everything runs in **mock mode** out of the box — no Twilio/Google credentials required to try it. SMS sends and calendar events are logged to the server console instead of hitting a real API, so the whole lead → qualify → book → remind loop is fully exercisable locally.

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate dev   # creates dev.db and applies the schema
npm run db:seed          # loads demo leads, conversations, and bookings
npm run dev
```

Open http://localhost:3000 for the dashboard.

## Environment variables

Copy `.env.example` to `.env` and fill in as needed — all are optional in development:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite connection string (already set to `file:./dev.db`) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Enables real SMS/voice; without these all sends are logged and mocked |
| `FORWARD_CALLS_TO` | If set, inbound calls ring this number first (via `<Dial>`) and only count as "missed" if unanswered. Without it, every inbound call is treated as missed immediately — the common setup for a solo operator. |
| `OWNER_NOTIFY_NUMBER` | Where instant "new HOT lead" alerts are texted (falls back to `FORWARD_CALLS_TO`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID` | Enables real Google Calendar sync for availability + booking |
| `CRON_SECRET` | Protects `/api/cron/tick`; Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET` |
| `BUSINESS_NAME`, `BUSINESS_SERVICE_TYPE`, `BUSINESS_CITY` | Seed values for the (single-tenant) business profile on first run |

## Wiring up Twilio

1. Buy/port a number in the Twilio console.
2. Set the number's **A Call Comes In** webhook to `POST https://<your-domain>/api/twilio/voice`.
3. Set the number's **A Message Comes In** webhook to `POST https://<your-domain>/api/twilio/sms`.
4. If using call forwarding, set `FORWARD_CALLS_TO` to the owner's cell — unanswered calls will hit `/api/twilio/voice-status` and trigger the missed-call flow automatically.

## Scheduling follow-ups and reminders

Nurture messages and appointment reminders are stored as `ScheduledTask` rows and sent by `GET /api/cron/tick`. `vercel.json` wires this to Vercel Cron every 15 minutes; if hosting elsewhere, point any scheduler (cron, GitHub Actions, etc.) at that endpoint on a similar interval.

## Project layout

```
prisma/schema.prisma        Business / Lead / Message / Appointment / ScheduledTask / CallLog / ContentIdea
src/lib/                    Twilio + Calendar clients (mock-mode aware), qualification engine,
                             follow-up scheduling, slot generation, content template bank
src/app/api/twilio/         Missed-call and inbound-SMS webhooks
src/app/api/booking/        Slot lookup, SMS slot offer, booking confirmation
src/app/api/cron/tick       Processes due follow-ups and appointment reminders
src/app/api/content/        Weekly content idea generation
src/app/                    Dashboard: overview, leads pipeline, lead detail + conversation,
                             bookings, content ideas, settings/integration status
```

## Not included (roadmap)

- Multi-tenant auth / billing (Stripe subscription, setup fee) for the $97–$297/mo SaaS model
- Facebook/Instagram DM integration and a website chat widget UI (the `/api/leads` POST endpoint already accepts intake from either)
- An LLM-backed qualification/content engine (current implementation is a fast, dependency-free rule-based engine — swap `src/lib/qualify.ts` / `src/lib/content.ts` for an LLM call behind the same function signatures when ready)
