import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { validateTwilioSignature } from "@/lib/twilio";
import { handleMissedCall } from "@/lib/missedCall";

const VoiceResponse = twilio.twiml.VoiceResponse;

function xml(body: string) {
  return new NextResponse(body, { headers: { "Content-Type": "text/xml" } });
}

/**
 * <Dial action> callback for the forward-to-owner flow. DialCallStatus is
 * "completed" when the owner answers; anything else (no-answer, busy,
 * failed) means the call went unanswered, so we trigger the missed-call SMS.
 */
export async function POST(req: NextRequest) {
  const params = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  const signature = req.headers.get("x-twilio-signature");

  if (!validateTwilioSignature(req.url, params, signature)) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const dialStatus = params.DialCallStatus;
  const from = params.From ?? "unknown";
  const to = params.To ?? "unknown";

  const response = new VoiceResponse();

  if (dialStatus && dialStatus !== "completed") {
    await handleMissedCall(from, to);
    response.say("Sorry we missed you. We just sent you a text — talk soon!");
  }

  response.hangup();
  return xml(response.toString());
}
