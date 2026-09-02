import { NextResponse } from "next/server";
import { getDefaultBusiness } from "@/lib/business";
import { getAvailableSlots } from "@/lib/slots";

export async function GET() {
  const business = await getDefaultBusiness();
  const slots = await getAvailableSlots(business.id);
  return NextResponse.json({ slots });
}
