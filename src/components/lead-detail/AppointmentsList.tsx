"use client";

import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  NO_SHOW: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};

export function AppointmentsList({ appointments, timezone }: { appointments: Appointment[]; timezone: string }) {
  const router = useRouter();

  async function setStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  if (!appointments.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Appointments</h3>
      <ul className="mt-3 space-y-2">
        {appointments.map((a) => (
          <li key={a.id} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">
                {new Date(a.scheduledAt).toLocaleString("en-US", {
                  timeZone: timezone,
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[a.status]}`}>{a.status}</span>
            </div>
            {(a.status === "PENDING" || a.status === "CONFIRMED") && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => setStatus(a.id, "COMPLETED")} className="text-[11px] font-medium text-emerald-600 hover:underline">
                  Mark completed
                </button>
                <button onClick={() => setStatus(a.id, "NO_SHOW")} className="text-[11px] font-medium text-red-600 hover:underline">
                  No-show
                </button>
                <button onClick={() => setStatus(a.id, "CANCELLED")} className="text-[11px] font-medium text-slate-500 hover:underline">
                  Cancel
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
