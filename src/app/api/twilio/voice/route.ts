import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { validateTwilioSignature } from "@/lib/twilio";
import { handleMissedCall } from "@/lib/missedCall";

const VoiceResponse = twilio.twiml.VoiceResponse;
const forwardTo = process.env.FORWARD_CALLS_TO;

function xml(body: string) {
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } });
}

/**
 * Inbound call webhook. If FORWARD_CALLS_TO is set, rings the owner's phone
 * first and only counts the call as "missed" if it goes unanswered (handled
 * in the /voice-status action callback). Without a forwarding number
 * configured, every inbound call is treated as missed immediately — the
 * common setup for a solo operator who wants texts, not phone tag.
 */
export async function POST(req: NextRequest) {
  const params = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  const signature = req.headers.get("x-twilio-signature");

  if (!validateTwilioSignature(req.url, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const from = params.From ?? "unknown";
  const to = params.To ?? "unknown";
  const response = new VoiceResponse();

  if (forwardTo) {
    const dial = response.dial({ timeout: 20, action: "/api/twilio/voice-status", callerId: to });
    dial.number(forwardTo);
  } else {
    await handleMissedCall(from, to);
    response.say("Thanks for calling. We just sent you a text — talk soon!");
    response.hangup();
  }

  return xml(response.toString());
}
