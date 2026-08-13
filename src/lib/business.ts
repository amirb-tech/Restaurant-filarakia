import { db } from "./db";

/**
 * MVP is single-tenant: one Business row backs the whole dashboard. Multi-
 * tenant auth/onboarding is a natural next step but out of scope here.
 */
export async function getDefaultBusiness() {
  const existing = await db.business.findFirst();
  if (existing) return existing;

  return db.business.create({
    data: {
      name: process.env.BUSINESS_NAME ?? "Summit Roofing & Exteriors",
      serviceType: process.env.BUSINESS_SERVICE_TYPE ?? "Roofing",
      city: process.env.BUSINESS_CITY ?? "Austin, TX",
      phone: process.env.TWILIO_FROM_NUMBER ?? "+15125550100",
    },
  });
}
