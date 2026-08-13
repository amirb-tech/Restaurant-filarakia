"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function BookingWidget({ leadId, timezone }: { leadId: string; timezone: string }) {
  const [slots, setSlots] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/booking/slots")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []));
  }, []);

  async function textOptions() {
    setBusy(true);
    await fetch("/api/booking/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    setBusy(false);
    router.refresh();
  }

  async function confirm(startISO: string) {
    setBusy(true);
    await fetch("/api/booking/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, startISO }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Book Appointment</h3>
        <button
          onClick={textOptions}
          disabled={busy}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Text options
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {slots === null && <p className="text-xs text-slate-400">Loading availability...</p>}
        {slots?.length === 0 && <p className="text-xs text-slate-400">No open slots this week.</p>}
        {slots?.slice(0, 5).map((s) => (
          <button
            key={s}
            disabled={busy}
            onClick={() => confirm(s)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50"
          >
            {new Date(s).toLocaleString("en-US", {
              timeZone: timezone,
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
