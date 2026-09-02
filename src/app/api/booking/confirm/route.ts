import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { sendSms } from "@/lib/twilio";
import { createCalendarEvent } from "@/lib/calendar";
import { scheduleAppointmentReminders, cancelPendingFollowUps } from "@/lib/followups";

/** Auto-confirms a booking: calendar event, confirmation SMS, reminders queued, lead moved to BOOKED. */
export async function POST(req: NextRequest) {
  const { leadId, startISO } = await req.json();
  if (!leadId || !startISO) {
    return NextResponse.json({ error: "leadId and startISO are required" }, { status: 400 });
  }

  const business = await getDefaultBusiness();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const scheduledAt = new Date(startISO);
  const durationMin = 60;
  const endISO = new Date(scheduledAt.getTime() + durationMin * 60 * 1000).toISOString();

  await createCalendarEvent({
    summary: `${lead.jobType ?? "Service"} — ${lead.name ?? lead.phone}`,
    description: [lead.notes, lead.location ? `Location: ${lead.location}` : null].filter(Boolean).join("\n"),
    startISO: scheduledAt.toISOString(),
    endISO,
  });

  const appointment = await db.appointment.create({
    data: { leadId: lead.id, scheduledAt, durationMin, status: "CONFIRMED" },
  });

  const when = scheduledAt.toLocaleString("en-US", {
    timeZone: business.timezone,
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const confirmationText = `You're booked for ${when}, we'll see you then! Reply here if anything changes.`;

  await sendSms(lead.phone, confirmationText);
  await db.message.create({ data: { leadId: lead.id, direction: "OUTBOUND", channel: "SMS", body: confirmationText } });

  await db.lead.update({ where: { id: lead.id }, data: { stage: "BOOKED" } });
  await cancelPendingFollowUps(lead.id);
  await scheduleAppointmentReminders(appointment.id, scheduledAt, lead.id);

  return NextResponse.json({ appointment });
}
