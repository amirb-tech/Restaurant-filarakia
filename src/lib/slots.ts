import { db } from "./db";
import { getBusyWindows } from "./calendar";

const BUSINESS_HOURS = { startHour: 9, endHour: 17 }; // 9am - 5pm
const SLOT_LENGTH_MIN = 60;
const DAYS_AHEAD = 7;

function overlaps(slotStart: Date, slotEnd: Date, busy: { start: string; end: string }[]) {
  return busy.some((b) => {
    const bStart = new Date(b.start).getTime();
    const bEnd = new Date(b.end).getTime();
    return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
  });
}

/**
 * Builds the list of bookable hour-long slots for the next week, excluding
 * anything already on the connected Google Calendar and anything already
 * booked in our own Appointment table.
 */
export async function getAvailableSlots(businessId: string): Promise<string[]> {
  const now = new Date();
  const rangeStart = new Date(now);
  const rangeEnd = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

  const [busy, existing] = await Promise.all([
    getBusyWindows(rangeStart.toISOString(), rangeEnd.toISOString()),
    db.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        scheduledAt: { gte: rangeStart, lte: rangeEnd },
        lead: { businessId },
      },
      select: { scheduledAt: true, durationMin: true },
    }),
  ]);

  const bookedWindows = existing.map((a) => ({
    start: a.scheduledAt.toISOString(),
    end: new Date(a.scheduledAt.getTime() + a.durationMin * 60 * 1000).toISOString(),
  }));

  const allBusy = [...busy, ...bookedWindows];
  const slots: string[] = [];

  for (let day = 0; day < DAYS_AHEAD; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue; // skip Sundays

    for (let hour = BUSINESS_HOURS.startHour; hour < BUSINESS_HOURS.endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      if (slotStart.getTime() <= now.getTime()) continue;

      const slotEnd = new Date(slotStart.getTime() + SLOT_LENGTH_MIN * 60 * 1000);
      if (!overlaps(slotStart, slotEnd, allBusy)) {
        slots.push(slotStart.toISOString());
      }
    }
  }

  return slots.slice(0, 20);
}
