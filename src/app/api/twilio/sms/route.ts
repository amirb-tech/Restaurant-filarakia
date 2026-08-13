import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { db } from "@/lib/db";
import { validateTwilioSignature, sendSms } from "@/lib/twilio";
import { getDefaultBusiness } from "@/lib/business";
import { qualifyLead, nextQualifyingQuestion } from "@/lib/qualify";
import { cancelPendingFollowUps } from "@/lib/followups";

const MessagingResponse = twilio.twiml.MessagingResponse;
const ownerNotifyNumber = process.env.OWNER_NOTIFY_NUMBER ?? process.env.FORWARD_CALLS_TO;

function xml(body: string) {
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } });
}

/**
 * Inbound SMS webhook. Every reply from a lead: gets logged, cancels the
 * pending nurture sequence (they're engaged now), runs the qualification
 * engine over the whole transcript, updates the CRM record, and — if the
 * lead now reads HOT — pings the owner. The auto-reply asks whatever
 * qualifying question is still outstanding.
 */
export async function POST(req: NextRequest) {
  const params = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  const signature = req.headers.get("x-twilio-signature");

  if (!validateTwilioSignature(req.url, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const from = params.From ?? "unknown";
  const body = (params.Body ?? "").trim();
  const business = await getDefaultBusiness();

  let lead = await db.lead.findFirst({
    where: { businessId: business.id, phone: from },
    orderBy: { createdAt: "desc" },
  });

  if (!lead) {
    lead = await db.lead.create({
      data: { businessId: business.id, phone: from, source: "sms", stage: "CONTACTED", temperature: "WARM" },
    });
  }

  await db.message.create({ data: { leadId: lead.id, direction: "INBOUND", channel: "SMS", body } });
  await cancelPendingFollowUps(lead.id, ["FOLLOW_UP_1H", "FOLLOW_UP_24H", "FOLLOW_UP_3D", "REACTIVATION"]);

  const history = await db.message.findMany({ where: { leadId: lead.id }, orderBy: { createdAt: "asc" } });
  const transcript = history.map((m) => m.body).join("\n");
  const qualification = qualifyLead(transcript);

  const wasHot = lead.temperature === "HOT";
  lead = await db.lead.update({
    where: { id: lead.id },
    data: {
      jobType: qualification.jobType ?? lead.jobType,
      urgency: qualification.urgency ?? lead.urgency,
      location: qualification.location ?? lead.location,
      budget: qualification.budget ?? lead.budget,
      temperature: qualification.temperature,
      notes: qualification.summary,
      stage: lead.stage === "NEW" || lead.stage === "CONTACTED" ? "QUALIFIED" : lead.stage,
    },
  });

  if (lead.temperature === "HOT" && !wasHot && ownerNotifyNumber) {
    const alert = `New HOT lead: ${lead.phone}${lead.jobType ? ` — ${lead.jobType}` : ""}${
      lead.location ? ` near ${lead.location}` : ""
    }. ${qualification.summary}.`;
    await sendSms(ownerNotifyNumber, alert);
  }

  const reply = nextQualifyingQuestion(lead);
  await db.message.create({ data: { leadId: lead.id, direction: "OUTBOUND", channel: "SMS", body: reply } });

  const twiml = new MessagingResponse();
  twiml.message(reply);
  return xml(twiml.toString());
}
