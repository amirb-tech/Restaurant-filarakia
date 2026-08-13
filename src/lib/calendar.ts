import { google } from "googleapis";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const calendarId = process.env.GOOGLE_CALENDAR_ID ?? "primary";

export const isCalendarConfigured = Boolean(clientId && clientSecret && refreshToken);

function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Creates a confirmed booking on the connected Google Calendar. In mock mode
 * (no OAuth credentials configured) this just logs the event so the booking
 * flow still works end-to-end during setup/demo.
 */
export async function createCalendarEvent(opts: {
  summary: string;
  description: string;
  startISO: string;
  endISO: string;
}): Promise<{ eventId: string; mock: boolean }> {
  if (!isCalendarConfigured) {
    console.log(`[calendar:mock] event "${opts.summary}" ${opts.startISO} -> ${opts.endISO}`);
    return { eventId: `mock_${Date.now()}`, mock: true };
  }

  const calendar = getCalendarClient();
  const res = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startISO },
      end: { dateTime: opts.endISO },
    },
  });

  return { eventId: res.data.id ?? "", mock: false };
}

/**
 * Returns Google Calendar busy windows for the given range. Returns an empty
 * list in mock mode — slot generation then only excludes times already
 * booked in our own Appointment table.
 */
export async function getBusyWindows(startISO: string, endISO: string): Promise<{ start: string; end: string }[]> {
  if (!isCalendarConfigured) return [];

  const calendar = getCalendarClient();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: startISO,
      timeMax: endISO,
      items: [{ id: calendarId }],
    },
  });

  const busy = res.data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({ start: b.start ?? "", end: b.end ?? "" }));
}
