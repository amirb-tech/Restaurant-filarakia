import { db } from "./db";
import { getDefaultBusiness } from "./business";
import { sendSms } from "./twilio";
import { scheduleMissedCallFollowUps } from "./followups";

const MISSED_CALL_TEXT = "Hey, sorry we missed your call — what can we help you with?";

/**
 * Core "never miss a lead" flow: log the missed call, upsert the caller as a
 * lead, fire the instant apology SMS, and queue the 1hr/24hr/3-day nurture
 * sequence. Shared by both the no-forwarding-number path (every call is
 * treated as missed) and the <Dial> action callback path (only genuinely
 * unanswered calls land here).
 */
export async function handleMissedCall(fromNumber: string, toNumber: string) {
  const business = await getDefaultBusiness();

  await db.callLog.create({
    data: { businessId: business.id, fromNumber, toNumber, missed: true },
  });

  let lead = await db.lead.findFirst({
    where: { businessId: business.id, phone: fromNumber },
    orderBy: { createdAt: "desc" },
  });

  if (!lead) {
    lead = await db.lead.create({
      data: {
        businessId: business.id,
        phone: fromNumber,
        source: "missed_call",
        stage: "NEW",
        temperature: "WARM",
      },
    });
  }

  const { mock } = await sendSms(fromNumber, MISSED_CALL_TEXT);

  await db.message.create({
    data: { leadId: lead.id, direction: "OUTBOUND", channel: "SMS", body: MISSED_CALL_TEXT },
  });

  if (lead.stage === "NEW") {
    await db.lead.update({ where: { id: lead.id }, data: { stage: "CONTACTED" } });
  }

  await scheduleMissedCallFollowUps(lead.id);

  return { lead, mock };
}
