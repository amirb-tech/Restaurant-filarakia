import { clsx } from "clsx";
import { STAGE_LABELS, type Stage, type Temperature } from "@/lib/types";

const TEMP_STYLES: Record<Temperature, string> = {
  HOT: "bg-red-50 text-red-700 ring-red-600/20",
  WARM: "bg-amber-50 text-amber-700 ring-amber-600/20",
  COLD: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

const TEMP_DOT: Record<Temperature, string> = {
  HOT: "bg-red-500",
  WARM: "bg-amber-500",
  COLD: "bg-sky-500",
};

export function TemperaturePill({ temperature }: { temperature: Temperature }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        TEMP_STYLES[temperature]
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", TEMP_DOT[temperature])} />
      {temperature}
    </span>
  );
}

const STAGE_STYLES: Record<Stage, string> = {
  NEW: "bg-slate-100 text-slate-700 ring-slate-500/20",
  CONTACTED: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  QUALIFIED: "bg-violet-50 text-violet-700 ring-violet-600/20",
  ESTIMATE_SENT: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20",
  BOOKED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  WON: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LOST: "bg-slate-100 text-slate-500 ring-slate-500/20",
};

export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset", STAGE_STYLES[stage])}>
      {STAGE_LABELS[stage]}
    </span>
  );
}
