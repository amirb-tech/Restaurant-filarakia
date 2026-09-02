import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function main() {
  const business = await db.business.upsert({
    where: { id: "demo-business" },
    update: {},
    create: {
      id: "demo-business",
      name: "Summit Roofing & Exteriors",
      serviceType: "Roofing",
      city: "Austin, TX",
      phone: "+15125550100",
      timezone: "America/Chicago",
    },
  });

  const now = Date.now();

  const leadsData = [
    {
      name: "Jamie Rivera",
      phone: "+15125551001",
      email: "jamie@example.com",
      source: "missed_call",
      jobType: "Roofing",
      urgency: "EMERGENCY",
      location: "78704",
      budget: "$8,000 - $12,000",
      temperature: "HOT",
      stage: "QUALIFIED",
      value: 10000,
      notes: "Roofing job, emergency / needs immediate attention, located near 78704, budget mentioned: $8,000 - $12,000, hot lead",
      createdAt: new Date(now - 2 * HOUR),
      messages: [
        { direction: "OUTBOUND", body: "Hey, sorry we missed your call — what can we help you with?", offset: -2 * HOUR },
        { direction: "INBOUND", body: "Hi, my roof is leaking badly near 78704, need someone today if possible. Budget is $8,000 - $12,000.", offset: -110 * 60 * 1000 },
        { direction: "OUTBOUND", body: "Got it! What kind of job do you need help with?", offset: -109 * 60 * 1000 },
        { direction: "INBOUND", body: "Roof leak, water coming into the attic", offset: -100 * 60 * 1000 },
        { direction: "OUTBOUND", body: "Thanks — how urgent is this? Today, this week, or no rush?", offset: -99 * 60 * 1000 },
      ],
    },
    {
      name: "Priya Nair",
      phone: "+15125551002",
      email: "priya@example.com",
      source: "website_chat",
      jobType: "Roofing",
      urgency: "THIS_WEEK",
      location: "Round Rock",
      budget: null,
      temperature: "WARM",
      stage: "ESTIMATE_SENT",
      value: 6500,
      notes: "Roofing job, wants service this week, located near Round Rock, warm lead",
      createdAt: new Date(now - 3 * DAY),
      messages: [
        { direction: "SYSTEM", channel: "SYSTEM", body: "Looking for a quote on a full shingle replacement in Round Rock, this week if possible.", offset: -3 * DAY },
        { direction: "OUTBOUND", body: "Hey Priya, thanks for reaching out to Summit Roofing & Exteriors! We'll text you shortly to get you booked.", offset: -3 * DAY + 60000 },
        { direction: "OUTBOUND", body: "You're booked for Thursday, we'll see you then! Reply here if anything changes.", offset: -2 * DAY },
      ],
    },
    {
      name: "Devon Marsh",
      phone: "+15125551003",
      email: null,
      source: "missed_call",
      jobType: "Roofing",
      urgency: "FLEXIBLE",
      location: null,
      budget: null,
      temperature: "COLD",
      stage: "CONTACTED",
      value: 0,
      notes: "Job type not yet identified, flexible timeline / early-stage, cold lead",
      createdAt: new Date(now - 5 * DAY),
      messages: [
        { direction: "OUTBOUND", body: "Hey, sorry we missed your call — what can we help you with?", offset: -5 * DAY },
        { direction: "INBOUND", body: "Just looking into pricing for next year, not urgent", offset: -5 * DAY + 30 * 60000 },
      ],
    },
    {
      name: "Sarah Kim",
      phone: "+15125551004",
      email: "sarah@example.com",
      source: "missed_call",
      jobType: "Roofing",
      urgency: "THIS_WEEK",
      location: "78745",
      budget: "$15,000",
      temperature: "HOT",
      stage: "WON",
      value: 15000,
      notes: "Roofing job, wants service this week, located near 78745, budget mentioned: $15,000, hot lead",
      createdAt: new Date(now - 10 * DAY),
      messages: [
        { direction: "OUTBOUND", body: "Hey, sorry we missed your call — what can we help you with?", offset: -10 * DAY },
        { direction: "INBOUND", body: "Need a full roof replacement, budget around $15,000, near 78745", offset: -10 * DAY + 20 * 60000 },
        { direction: "OUTBOUND", body: "You're all set — job's approved! We'll be in touch to confirm crew arrival and what to expect on-site.", offset: -6 * DAY },
      ],
    },
    {
      name: null,
      phone: "+15125551005",
      email: null,
      source: "missed_call",
      jobType: null,
      urgency: null,
      location: null,
      budget: null,
      temperature: "WARM",
      stage: "NEW",
      value: 0,
      notes: null,
      createdAt: new Date(now - 20 * 60 * 1000),
      messages: [{ direction: "OUTBOUND", body: "Hey, sorry we missed your call — what can we help you with?", offset: -20 * 60 * 1000 }],
    },
  ] as const;

  for (const l of leadsData) {
    const lead = await db.lead.create({
      data: {
        businessId: business.id,
        name: l.name,
        phone: l.phone,
        email: l.email,
        source: l.source,
        jobType: l.jobType,
        urgency: l.urgency,
        location: l.location,
        budget: l.budget,
        temperature: l.temperature,
        stage: l.stage,
        value: l.value,
        notes: l.notes,
        createdAt: l.createdAt,
        updatedAt: l.createdAt,
      },
    });

    for (const m of l.messages) {
      await db.message.create({
        data: {
          leadId: lead.id,
          direction: m.direction,
          channel: "channel" in m ? m.channel : "SMS",
          body: m.body,
          createdAt: new Date(now + m.offset),
        },
      });
    }

    await db.callLog.create({
      data: { businessId: business.id, fromNumber: l.phone, toNumber: business.phone, missed: true, createdAt: l.createdAt },
    });
  }

  const priya = await db.lead.findFirst({ where: { phone: "+15125551002" } });
  const sarah = await db.lead.findFirst({ where: { phone: "+15125551004" } });

  if (priya) {
    await db.appointment.create({
      data: { leadId: priya.id, scheduledAt: new Date(now + 2 * DAY), status: "CONFIRMED" },
    });
  }
  if (sarah) {
    await db.appointment.create({
      data: { leadId: sarah.id, scheduledAt: new Date(now - 4 * DAY), status: "COMPLETED" },
    });
  }

  console.log(`Seeded business "${business.name}" with ${leadsData.length} demo leads.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
