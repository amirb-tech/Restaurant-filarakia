import Link from "next/link";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { PageHeader } from "@/components/PageHeader";
import { TemperaturePill } from "@/components/Badges";
import { STAGES, STAGE_LABELS, type Stage, type Temperature } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const business = await getDefaultBusiness();
  const leads = await db.lead.findMany({
    where: { businessId: business.id },
    orderBy: { updatedAt: "desc" },
  });

  const columns = STAGES.filter((s) => s !== "LOST").map((stage) => ({
    stage,
    leads: leads.filter((l) => l.stage === stage),
  }));

  return (
    <>
      <PageHeader title="Leads" subtitle={`${leads.length} total · pipeline view`} />
      <div className="flex-1 overflow-x-auto p-8">
        <div className="flex gap-4">
          {columns.map((col) => (
            <div key={col.stage} className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/70">
              <div className="flex items-center justify-between px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-700">{STAGE_LABELS[col.stage as Stage]}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                  {col.leads.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 px-2 pb-3">
                {col.leads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="text-sm font-medium text-slate-900">{lead.name ?? lead.phone}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{lead.jobType ?? "Job type unknown"}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <TemperaturePill temperature={lead.temperature as Temperature} />
                      {lead.value > 0 && <span className="text-xs font-medium text-slate-600">${lead.value.toLocaleString()}</span>}
                    </div>
                  </Link>
                ))}
                {col.leads.length === 0 && <div className="px-2 py-4 text-center text-xs text-slate-400">No leads</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
