import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { PageHeader } from "@/components/PageHeader";
import { TemperaturePill } from "@/components/Badges";
import { ConversationThread } from "@/components/lead-detail/ConversationThread";
import { StageControls } from "@/components/lead-detail/StageControls";
import { BookingWidget } from "@/components/lead-detail/BookingWidget";
import { AppointmentsList } from "@/components/lead-detail/AppointmentsList";
import type { Temperature } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await getDefaultBusiness();
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      appointments: { orderBy: { scheduledAt: "desc" } },
    },
  });

  if (!lead) notFound();

  const messages = lead.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
  const appointments = lead.appointments.map((a) => ({ ...a, scheduledAt: a.scheduledAt.toISOString() }));

  return (
    <>
      <PageHeader
        title={lead.name ?? lead.phone}
        subtitle={lead.phone}
        actions={<TemperaturePill temperature={lead.temperature as Temperature} />}
      />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ConversationThread leadId={lead.id} initialMessages={messages} />
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Lead Details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Job Type</dt>
                  <dd className="font-medium text-slate-800">{lead.jobType ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Urgency</dt>
                  <dd className="font-medium text-slate-800">{lead.urgency ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-800">{lead.location ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Budget</dt>
                  <dd className="font-medium text-slate-800">{lead.budget ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Source</dt>
                  <dd className="font-medium text-slate-800">{lead.source}</dd>
                </div>
              </dl>
              {lead.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{lead.notes}</p>}
            </div>

            <StageControls leadId={lead.id} stage={lead.stage} temperature={lead.temperature} />
            <BookingWidget leadId={lead.id} timezone={business.timezone} />
            <AppointmentsList appointments={appointments} timezone={business.timezone} />
          </div>
        </div>
      </div>
    </>
  );
}
