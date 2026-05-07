"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const TRACKS = ["FOUNDATION", "PROJECTS", "GRADUATED", "INACTIVE"] as const;

export async function bulkCreateReports(input: unknown) {
  const data = z
    .object({
      tracks: z.array(z.enum(TRACKS)).min(1),
      periodStart: z.string().min(1),
      periodEnd: z.string().min(1),
      narrative: z.string().trim().max(500).optional().nullable(),
      goals: z.string().trim().max(500).optional().nullable(),
      autoAttendance: z.boolean().optional().default(true),
    })
    .parse(input);

  const start = new Date(data.periodStart);
  const end = new Date(data.periodEnd);
  end.setUTCHours(23, 59, 59, 0);

  const students = await prisma.student.findMany({
    where: { active: true, track: { in: data.tracks } },
  });

  let created = 0;
  let skipped = 0;

  for (const s of students) {
    // Skip if a report already exists for the same period.
    const existing = await prisma.reportCard.findFirst({
      where: {
        studentId: s.id,
        periodStart: start,
        periodEnd: end,
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    let pct: number | null = null;
    if (data.autoAttendance) {
      const records = await prisma.attendanceRecord.findMany({
        where: {
          studentId: s.id,
          session: { date: { gte: start, lte: end } },
        },
        select: { status: true },
      });
      if (records.length > 0) {
        const present = records.filter(
          (r) => r.status === "PRESENT" || r.status === "LATE"
        ).length;
        pct = Math.round((present / records.length) * 100);
      }
    }

    await prisma.reportCard.create({
      data: {
        studentId: s.id,
        periodStart: start,
        periodEnd: end,
        attendancePct: pct,
        narrative: data.narrative || null,
        goals: data.goals || null,
      },
    });
    created++;
  }

  revalidatePath("/students");
  // Revalidate each student's detail page so the report card list shows the new draft.
  for (const s of students) {
    revalidatePath(`/students/${s.id}`);
  }

  return { created, skipped, total: students.length };
}
