import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { PageHeader } from "@/components/PageHeader";
import { GenerateContentButton } from "@/components/content/GenerateContentButton";

export const dynamic = "force-dynamic";

const PLATFORM_ICON: Record<string, string> = {
  "Instagram Reels": "🎬",
  Facebook: "📘",
  "Google Business Profile": "📍",
};

export default async function ContentPage() {
  const business = await getDefaultBusiness();
  const ideas = await db.contentIdea.findMany({ where: { businessId: business.id }, orderBy: { weekOf: "desc" } });

  const weeks = Array.from(new Set(ideas.map((i) => i.weekOf.toISOString())));

  return (
    <>
      <PageHeader
        title="Content Ideas"
        subtitle={`Weekly content tailored to ${business.serviceType} in ${business.city}`}
        actions={<GenerateContentButton />}
      />
      <div className="flex-1 overflow-y-auto p-8">
        {weeks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No content ideas yet — generate this week&apos;s batch to get hooks, captions, and CTAs for Reels, Facebook, and
            Google Business Profile.
          </div>
        )}
        {weeks.map((week) => (
          <div key={week} className="mb-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Week of {new Date(week).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {ideas
                .filter((i) => i.weekOf.toISOString() === week)
                .map((idea) => (
                  <div key={idea.id} className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <span>{PLATFORM_ICON[idea.platform] ?? "✨"}</span>
                      {idea.platform}
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">{idea.hook}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{idea.caption}</p>
                    <p className="mt-3 text-xs font-medium text-blue-600">{idea.cta}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
