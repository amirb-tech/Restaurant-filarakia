import { db } from "./db";
import type { ScheduledTaskType } from "./types";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const FOLLOW_UP_DELAYS: Record<"FOLLOW_UP_1H" | "FOLLOW_UP_24H" | "FOLLOW_UP_3D", number> = {
  FOLLOW_UP_1H: 1 * HOUR,
  FOLLOW_UP_24H: 24 * HOUR,
  FOLLOW_UP_3D: 3 * DAY,
};

/** Queues the standard 1hr / 24hr / 3-day nurture sequence after a missed-call SMS goes unanswered. */
export async function scheduleMissedCallFollowUps(leadId: string, from: Date = new Date()) {
  await db.scheduledTask.createMany({
    data: (Object.keys(FOLLOW_UP_DELAYS) as (keyof typeof FOLLOW_UP_DELAYS)[]).map((type) => ({
      leadId,
      type,
      runAt: new Date(from.getTime() + FOLLOW_UP_DELAYS[type]),
    })),
  });
}

/** Cancels any pending nurture tasks for a lead — called whenever the lead replies. */
export async function cancelPendingFollowUps(leadId: string, types?: ScheduledTaskType[]) {
  await db.scheduledTask.updateMany({
    where: {
      leadId,
      status: "PENDING",
      ...(types ? { type: { in: types } } : {}),
    },
    data: { status: "CANCELLED" },
  });
}

/** Queues a "want to move forward?" nudge two days after an estimate is sent. */
export async function scheduleEstimateFollowUp(leadId: string, from: Date = new Date()) {
  await db.scheduledTask.create({
    data: { leadId, type: "ESTIMATE_FOLLOW_UP", runAt: new Date(from.getTime() + 2 * DAY) },
  });
}

/** Queues a "still interested?" reactivation touch a week after a lead has gone quiet. */
export async function scheduleReactivation(leadId: string, from: Date = new Date()) {
  await db.scheduledTask.create({
    data: { leadId, type: "REACTIVATION", runAt: new Date(from.getTime() + 7 * DAY) },
  });
}

/** Queues the 24hr and 2hr pre-appointment reminders for a confirmed booking. */
export async function scheduleAppointmentReminders(appointmentId: string, scheduledAt: Date, leadId: string) {
  const now = Date.now();
  const tasks: { leadId: string; type: ScheduledTaskType; runAt: Date; payload: string }[] = [];

  const reminder24 = new Date(scheduledAt.getTime() - 24 * HOUR);
  if (reminder24.getTime() > now) {
    tasks.push({ leadId, type: "APPOINTMENT_REMINDER_24H", runAt: reminder24, payload: appointmentId });
  }

  const reminder2 = new Date(scheduledAt.getTime() - 2 * HOUR);
  if (reminder2.getTime() > now) {
    tasks.push({ leadId, type: "APPOINTMENT_REMINDER_2H", runAt: reminder2, payload: appointmentId });
  }

  if (tasks.length) await db.scheduledTask.createMany({ data: tasks });
}

/** Queues a same-day rebooking nudge after a lead no-shows an appointment. */
export async function scheduleNoShowReschedule(leadId: string, from: Date = new Date()) {
  await db.scheduledTask.create({
    data: { leadId, type: "NO_SHOW_RESCHEDULE", runAt: new Date(from.getTime() + 2 * HOUR) },
  });
}

interface LeadLike {
  name?: string | null;
  jobType?: string | null;
}

const firstName = (lead: LeadLike) => (lead.name ? lead.name.split(" ")[0] : "there");

export function buildFollowUpMessage(type: ScheduledTaskType, lead: LeadLike, businessName: string): string {
  const name = firstName(lead);
  const job = lead.jobType ? ` about your ${lead.jobType.toLowerCase()} job` : "";

  switch (type) {
    case "FOLLOW_UP_1H":
      return `Hi ${name}, just checking back in${job} — what's the best way to help? Reply here anytime.`;
    case "FOLLOW_UP_24H":
      return `Hey ${name}, still around? We'd love to get you a quote${job}. Text back and we'll get you booked.`;
    case "FOLLOW_UP_3D":
      return `Hi ${name}, following up one more time from ${businessName} — if now isn't a good time, no worries, just let us know and we'll check back later.`;
    case "ESTIMATE_FOLLOW_UP":
      return `Hi ${name}, wanted to follow up on the estimate we sent over — want to move forward? Happy to answer any questions.`;
    case "REACTIVATION":
      return `Hey ${name}, it's been a bit since we last talked — still interested in getting that job done? We've got availability this week.`;
    case "NO_SHOW_RESCHEDULE":
      return `Hi ${name}, sorry we missed each other! Want to grab a new time that works better for you?`;
    case "APPOINTMENT_REMINDER_24H":
      return `Reminder from ${businessName}: you're booked for tomorrow. Reply if you need to reschedule.`;
    case "APPOINTMENT_REMINDER_2H":
      return `See you soon! Your appointment with ${businessName} is in about 2 hours.`;
    default:
      return `Hi ${name}, following up from ${businessName}.`;
  }
}
