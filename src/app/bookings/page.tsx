import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { PageHeader } from "@/components/PageHeader";
import { AppointmentRow } from "@/components/bookings/AppointmentRow";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const business = await getDefaultBusiness();
  const appointments = await db.appointment.findMany({
    where: { lead: { businessId: business.id } },
    include: { lead: true },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Bookings" subtitle={`${appointments.length} total appointments`} />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Job</th>
                <th className="px-5 py-3 font-medium">Date &amp; Time</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appt) => (
                <AppointmentRow
                  key={appt.id}
                  appointment={{ id: appt.id, scheduledAt: appt.scheduledAt.toISOString(), status: appt.status }}
                  lead={{ id: appt.lead.id, name: appt.lead.name, phone: appt.lead.phone, jobType: appt.lead.jobType }}
                  timezone={business.timezone}
                />
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-400">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
