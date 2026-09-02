import { NextResponse } from "next/server";
import { startOfWeek } from "date-fns";
import { db } from "@/lib/db";
import { getDefaultBusiness } from "@/lib/business";
import { generateWeeklyContentIdeas } from "@/lib/content";

/** Generates (and persists) this week's content ideas for the business's service line. */
export async function POST() {
  const business = await getDefaultBusiness();
  const weekOf = startOfWeek(new Date(), { weekStartsOn: 1 });

  const existing = await db.contentIdea.findMany({ where: { businessId: business.id, weekOf } });
  if (existing.length) return NextResponse.json({ ideas: existing });

  const drafts = generateWeeklyContentIdeas(business.serviceType, business.city);
  await db.contentIdea.createMany({
    data: drafts.map((d) => ({ businessId: business.id, weekOf, ...d })),
  });

  const ideas = await db.contentIdea.findMany({ where: { businessId: business.id, weekOf } });
  return NextResponse.json({ ideas });
}

export async function GET() {
  const business = await getDefaultBusiness();
  const ideas = await db.contentIdea.findMany({ where: { businessId: business.id }, orderBy: { weekOf: "desc" } });
  return NextResponse.json({ ideas });
}
