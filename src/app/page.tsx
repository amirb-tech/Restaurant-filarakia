import Link from "next/link";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { PageHeader } from "@/components/PageHeader";
import { TemperaturePill, StagePill } from "@/components/Badges";
import type { Stage, Temperature } from "@/lib/types";

export const dynamic = "force-dynamic";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export default async function OverviewPage() {
  const business = await getDefaultBusiness();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalLeads, hotLeads, missedCallsThisWeek, upcomingAppointments, pipelineLeads, staleLeads, recentLeads] =
    await Promise.all([
      db.lead.count({ where: { businessId: business.id } }),
      db.lead.count({ where: { businessId: business.id, temperature: "HOT", stage: { notIn: ["WON", "LOST"] } } }),
      db.callLog.count({ where: { businessId: business.id, missed: true, createdAt: { gte: weekAgo } } }),
      db.appointment.findMany({
        where: { status: { in: ["PENDING", "CONFIRMED"] }, scheduledAt: { gte: now }, lead: { businessId: business.id } },
        include: { lead: true },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      db.lead.findMany({ where: { businessId: business.id, stage: { notIn: ["WON", "LOST"] } }, select: { value: true } }),
      db.lead.count({
        where: { businessId: business.id, stage: { in: ["NEW", "CONTACTED"] }, updatedAt: { lt: dayAgo } },
      }),
      db.lead.findMany({
        where: { businessId: business.id },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

  const pipelineValue = pipelineLeads.reduce((sum, l) => sum + l.value, 0);

  return (
    <>
      <PageHeader title="Overview" subtitle={`${business.name} · ${business.city}`} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total Leads" value={String(totalLeads)} />
          <StatCard label="Hot Leads" value={String(hotLeads)} hint="Need attention now" />
          <StatCard label="Missed Calls (7d)" value={String(missedCallsThisWeek)} hint="All auto-texted" />
          <StatCard label="Revenue Pipeline" value={`$${pipelineValue.toLocaleString()}`} />
          <StatCard label="Missed Opportunities" value={String(staleLeads)} hint="No reply in 24h+" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Recent Leads</h2>
              <Link href="/leads" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View pipeline →
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {recentLeads.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No leads yet.</li>}
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/leads/${lead.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{lead.name ?? lead.phone}</div>
                      <div className="text-xs text-slate-500">{lead.jobType ?? "Job type unknown"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TemperaturePill temperature={lead.temperature as Temperature} />
                      <StagePill stage={lead.stage as Stage} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">Upcoming Bookings</h2>
              <Link href="/bookings" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {upcomingAppointments.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">Nothing booked yet.</li>}
              {upcomingAppointments.map((appt) => (
                <li key={appt.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{appt.lead.name ?? appt.lead.phone}</div>
                    <div className="text-xs text-slate-500">{appt.lead.jobType ?? "Job"}</div>
                  </div>
                  <div className="text-xs font-medium text-slate-600">
                    {appt.scheduledAt.toLocaleString("en-US", {
                      timeZone: business.timezone,
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
