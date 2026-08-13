import { getDefaultBusiness } from "@/lib/business";
import { isTwilioConfigured } from "@/lib/twilio";
import { isCalendarConfigured } from "@/lib/calendar";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

function IntegrationRow({ name, description, connected, envVars }: { name: string; description: string; connected: boolean; envVars: string[] }) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 py-4 last:border-0">
      <div>
        <div className="text-sm font-medium text-slate-900">{name}</div>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        <p className="mt-1 font-mono text-[11px] text-slate-400">{envVars.join(", ")}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
          connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
        }`}
      >
        {connected ? "Connected" : "Mock mode"}
      </span>
    </div>
  );
}

export default async function SettingsPage() {
  const business = await getDefaultBusiness();

  return (
    <>
      <PageHeader title="Settings" subtitle="Business profile and integrations" />
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Business Profile</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium text-slate-800">{business.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Service Type</dt>
                <dd className="font-medium text-slate-800">{business.serviceType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">City</dt>
                <dd className="font-medium text-slate-800">{business.city}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-800">{business.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Timezone</dt>
                <dd className="font-medium text-slate-800">{business.timezone}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-400">
              Set BUSINESS_NAME, BUSINESS_SERVICE_TYPE, and BUSINESS_CITY env vars before first run to customize.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Integrations</h2>
            <div className="mt-2">
              <IntegrationRow
                name="Twilio (SMS + Voice)"
                description="Missed-call texts, follow-ups, reminders, and booking confirmations."
                connected={isTwilioConfigured}
                envVars={["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]}
              />
              <IntegrationRow
                name="Google Calendar"
                description="Two-way sync for booking availability and confirmed appointments."
                connected={isCalendarConfigured}
                envVars={["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]}
              />
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Until these are connected, SMS and calendar actions run in mock mode — everything still works end-to-end
              and logs to the server console instead of sending real messages.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
