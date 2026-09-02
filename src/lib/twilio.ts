import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

export const isTwilioConfigured = Boolean(accountSid && authToken && fromNumber);

const client = isTwilioConfigured ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS via Twilio when credentials are configured. Falls back to a
 * console-logged mock so the whole lead-capture flow is exercisable (and
 * demoable) without a Twilio account.
 */
export async function sendSms(to: string, body: string): Promise<{ sid: string; mock: boolean }> {
  if (!client || !fromNumber) {
    console.log(`[twilio:mock] SMS to ${to}: ${body}`);
    return { sid: `mock_${Date.now()}`, mock: true };
  }

  const message = await client.messages.create({ to, from: fromNumber, body });
  return { sid: message.sid, mock: false };
}

/**
 * Validates that an inbound webhook request actually came from Twilio.
 * Skipped in mock mode since there is no auth token to validate against.
 */
export function validateTwilioSignature(url: string, params: Record<string, string>, signature: string | null): boolean {
  if (!isTwilioConfigured) return true;
  if (!signature || !authToken) return false;
  return twilio.validateRequest(authToken, signature, url, params);
}
