import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/twilio";

/** Lets the owner send a manual SMS from the dashboard's conversation thread. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { body } = await req.json();
  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  await sendSms(lead.phone, body);
  const message = await db.message.create({
    data: { leadId: id, direction: "OUTBOUND", channel: "SMS", body },
  });

  return NextResponse.json({ message });
}
