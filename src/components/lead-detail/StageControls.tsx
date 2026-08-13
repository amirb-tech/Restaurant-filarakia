"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { STAGES, STAGE_LABELS, TEMPERATURES, type Stage, type Temperature } from "@/lib/types";

export function StageControls({ leadId, stage, temperature }: { leadId: string; stage: string; temperature: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function update(data: Record<string, string>) {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Stage &amp; Priority</h3>
      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Pipeline Stage</span>
          <select
            defaultValue={stage}
            disabled={isPending}
            onChange={(e) => update({ stage: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s as Stage]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Temperature</span>
          <select
            defaultValue={temperature}
            disabled={isPending}
            onChange={(e) => update({ temperature: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            {TEMPERATURES.map((t) => (
              <option key={t} value={t as Temperature}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
