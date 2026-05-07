import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding…");

  // Single coach record for MVP (no auth — used as recordedBy for actions).
  const coach = await prisma.coach.upsert({
    where: { email: "malhar@cautiontape.ca" },
    update: {},
    create: {
      name: "Malhar Soni",
      email: "malhar@cautiontape.ca",
    },
  });
  console.log(`Coach: ${coach.name}`);

  // Current season.
  const existing = await prisma.season.findFirst({ where: { current: true } });
  const season =
    existing ??
    (await prisma.season.create({
      data: {
        name: "Push Back 2025-26",
        current: true,
        startDate: new Date("2025-05-03"),
      },
    }));
  console.log(`Season: ${season.name}`);

  // 4 default curriculum timeslots — coach can rename later.
  const timeslots = [
    { name: "Morning 1", startTime: "09:00", endTime: "11:00", order: 0 },
    { name: "Morning 2", startTime: "11:00", endTime: "13:00", order: 1 },
    { name: "Afternoon 1", startTime: "13:30", endTime: "15:30", order: 2 },
    { name: "Afternoon 2", startTime: "15:30", endTime: "17:30", order: 3 },
  ];
  for (const ts of timeslots) {
    await prisma.curriculumTimeslot.upsert({
      where: { order: ts.order },
      update: {},
      create: ts,
    });
  }
  console.log(`Timeslots: ${timeslots.length}`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
