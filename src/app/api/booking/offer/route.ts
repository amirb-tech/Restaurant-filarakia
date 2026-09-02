import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { getAvailableSlots } from "@/lib/slots";
import { sendSms } from "@/lib/twilio";

function formatSlot(iso: string, timezone: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Texts a lead the next 3 open slots — the SMS half of "AI offers available time slots". */
export async function POST(req: NextRequest) {
  const { leadId } = await req.json();
  if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

  const business = await getDefaultBusiness();
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const slots = (await getAvailableSlots(business.id)).slice(0, 3);
  if (!slots.length) return NextResponse.json({ error: "no slots available" }, { status: 409 });

  const list = slots.map((s, i) => `${i + 1}) ${formatSlot(s, business.timezone)}`).join("\n");
  const body = `We've got a few openings — reply with the number that works best:\n${list}`;

  await sendSms(lead.phone, body);
  await db.message.create({ data: { leadId: lead.id, direction: "OUTBOUND", channel: "SMS", body } });

  return NextResponse.json({ slots });
}
