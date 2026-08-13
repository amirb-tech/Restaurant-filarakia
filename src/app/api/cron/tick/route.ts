import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/twilio";
import { buildFollowUpMessage } from "@/lib/followups";
import { getDefaultBusiness } from "@/lib/business";
import type { ScheduledTaskType } from "@/lib/types";

const APPOINTMENT_REMINDER_TYPES: ScheduledTaskType[] = ["APPOINTMENT_REMINDER_24H", "APPOINTMENT_REMINDER_2H"];

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured: demo/dev mode, allow
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Processes every due ScheduledTask: nurture follow-ups and appointment
 * reminders. Meant to be hit on a schedule (Vercel Cron, an external
 * scheduler, etc.) every 5-15 minutes — see vercel.json.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const business = await getDefaultBusiness();
  const due = await db.scheduledTask.findMany({
    where: { status: "PENDING", runAt: { lte: new Date() } },
    include: { lead: true },
    orderBy: { runAt: "asc" },
    take: 200,
  });

  const results: { taskId: string; type: string; status: string }[] = [];

  for (const task of due) {
    try {
      if (APPOINTMENT_REMINDER_TYPES.includes(task.type as ScheduledTaskType)) {
        const appointment = task.payload ? await db.appointment.findUnique({ where: { id: task.payload } }) : null;

        if (!appointment || appointment.status === "CANCELLED" || appointment.status === "NO_SHOW") {
          await db.scheduledTask.update({ where: { id: task.id }, data: { status: "CANCELLED" } });
          results.push({ taskId: task.id, type: task.type, status: "cancelled_stale" });
          continue;
        }

        const alreadySent =
          (task.type === "APPOINTMENT_REMINDER_24H" && appointment.reminder24Sent) ||
          (task.type === "APPOINTMENT_REMINDER_2H" && appointment.reminder2Sent);

        if (!alreadySent) {
          const message = buildFollowUpMessage(task.type as ScheduledTaskType, task.lead, business.name);
          await sendSms(task.lead.phone, message);
          await db.message.create({ data: { leadId: task.lead.id, direction: "OUTBOUND", channel: "SMS", body: message } });
          await db.appointment.update({
            where: { id: appointment.id },
            data:
              task.type === "APPOINTMENT_REMINDER_24H" ? { reminder24Sent: true } : { reminder2Sent: true },
          });
        }
      } else {
        const message = buildFollowUpMessage(task.type as ScheduledTaskType, task.lead, business.name);
        await sendSms(task.lead.phone, message);
        await db.message.create({ data: { leadId: task.lead.id, direction: "OUTBOUND", channel: "SMS", body: message } });
      }

      await db.scheduledTask.update({ where: { id: task.id }, data: { status: "SENT" } });
      results.push({ taskId: task.id, type: task.type, status: "sent" });
    } catch (err) {
      console.error(`[cron/tick] failed task ${task.id}`, err);
      await db.scheduledTask.update({ where: { id: task.id }, data: { status: "FAILED" } });
      results.push({ taskId: task.id, type: task.type, status: "failed" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
