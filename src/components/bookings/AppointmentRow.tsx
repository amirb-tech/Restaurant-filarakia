"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  CONFIRMED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  NO_SHOW: "bg-red-50 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};

interface Props {
  appointment: { id: string; scheduledAt: string; status: string };
  lead: { id: string; name: string | null; phone: string; jobType: string | null };
  timezone: string;
}

export function AppointmentRow({ appointment, lead, timezone }: Props) {
  const router = useRouter();

  async function setStatus(status: string) {
    await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-3">
        <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:text-blue-600">
          {lead.name ?? lead.phone}
        </Link>
      </td>
      <td className="px-5 py-3 text-slate-600">{lead.jobType ?? "—"}</td>
      <td className="px-5 py-3 text-slate-600">
        {new Date(appointment.scheduledAt).toLocaleString("en-US", {
          timeZone: timezone,
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[appointment.status]}`}>
          {appointment.status}
        </span>
      </td>
      <td className="px-5 py-3">
        {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
          <div className="flex gap-3">
            <button onClick={() => setStatus("COMPLETED")} className="text-xs font-medium text-emerald-600 hover:underline">
              Complete
            </button>
            <button onClick={() => setStatus("NO_SHOW")} className="text-xs font-medium text-red-600 hover:underline">
              No-show
            </button>
            <button onClick={() => setStatus("CANCELLED")} className="text-xs font-medium text-slate-500 hover:underline">
              Cancel
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
