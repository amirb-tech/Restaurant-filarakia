import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { sendSms } from "@/lib/twilio";
import { qualifyLead } from "@/lib/qualify";

export async function GET() {
  const business = await getDefaultBusiness();
  const leads = await db.lead.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
  return NextResponse.json({ leads });
}

/**
 * Lead intake for non-call channels — website chat widget or a contact-form
 * POST. Runs the same qualification engine over the submitted message and
 * fires the same instant SMS acknowledgment as a missed call.
 */
export async function POST(req: NextRequest) {
  const { name, phone, email, message, source } = await req.json();
  if (!phone) return NextResponse.json({ error: "phone is required" }, { status: 400 });

  const business = await getDefaultBusiness();
  const qualification = qualifyLead(message ?? "");

  const lead = await db.lead.create({
    data: {
      businessId: business.id,
      name: name ?? null,
      phone,
      email: email ?? null,
      source: source ?? "website_chat",
      jobType: qualification.jobType,
      urgency: qualification.urgency,
      location: qualification.location,
      budget: qualification.budget,
      temperature: qualification.temperature,
      notes: qualification.summary,
      stage: "NEW",
    },
  });

  if (message) {
    await db.message.create({ data: { leadId: lead.id, direction: "INBOUND", channel: "SYSTEM", body: message } });
  }

  const ack = `Hey ${name ? name.split(" ")[0] : "there"}, thanks for reaching out to ${business.name}! We'll text you shortly to get you booked.`;
  await sendSms(phone, ack);
  await db.message.create({ data: { leadId: lead.id, direction: "OUTBOUND", channel: "SMS", body: ack } });

  return NextResponse.json({ lead }, { status: 201 });
}
