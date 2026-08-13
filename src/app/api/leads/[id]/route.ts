import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/twilio";
import { scheduleEstimateFollowUp, cancelPendingFollowUps } from "@/lib/followups";
import { STAGES, TEMPERATURES } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      appointments: { orderBy: { scheduledAt: "desc" } },
    },
  });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

const JOB_START_TEXT =
  "You're all set — job's approved! We'll be in touch to confirm crew arrival and what to expect on-site.";

/**
 * Stage/temperature updates drive side effects: moving to ESTIMATE_SENT
 * queues the "want to move forward?" nudge, WON sends the job-start
 * confirmation, LOST/CANCELLED clears any pending nurture tasks.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.stage && STAGES.includes(body.stage)) data.stage = body.stage;
  if (body.temperature && TEMPERATURES.includes(body.temperature)) data.temperature = body.temperature;
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.value === "number") data.value = body.value;
  if (typeof body.notes === "string") data.notes = body.notes;

  const updated = await db.lead.update({ where: { id }, data });

  if (data.stage === "ESTIMATE_SENT" && lead.stage !== "ESTIMATE_SENT") {
    await scheduleEstimateFollowUp(id);
  }

  if (data.stage === "WON" && lead.stage !== "WON") {
    await sendSms(lead.phone, JOB_START_TEXT);
    await db.message.create({ data: { leadId: id, direction: "OUTBOUND", channel: "SMS", body: JOB_START_TEXT } });
    await cancelPendingFollowUps(id);
  }

  if (data.stage === "LOST" && lead.stage !== "LOST") {
    await cancelPendingFollowUps(id);
  }

  return NextResponse.json({ lead: updated });
}
