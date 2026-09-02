import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { APPOINTMENT_STATUSES } from "@/lib/types";
import { scheduleNoShowReschedule } from "@/lib/followups";

/** Marking an appointment NO_SHOW queues a same-day rebooking nudge. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await req.json();
  if (!APPOINTMENT_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const appointment = await db.appointment.update({ where: { id }, data: { status } });

  if (status === "NO_SHOW") {
    await scheduleNoShowReschedule(appointment.leadId);
  }

  return NextResponse.json({ appointment });
}
