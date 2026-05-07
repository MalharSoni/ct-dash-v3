"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const reportSchema = z.object({
  studentId: z.string(),
  periodStart: z.string().min(1),
  periodEnd: z.string().min(1),
  attendancePct: z.coerce.number().min(0).max(100).optional().nullable(),
  overallRating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  narrative: z.string().trim().max(5000).optional().nullable(),
  goals: z.string().trim().max(2000).optional().nullable(),
});

export async function createReport(input: unknown) {
  const data = reportSchema.parse(input);
  const r = await prisma.reportCard.create({
    data: {
      studentId: data.studentId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      attendancePct: data.attendancePct ?? null,
      overallRating: data.overallRating ?? null,
      narrative: data.narrative || null,
      goals: data.goals || null,
    },
  });
  revalidatePath(`/students/${data.studentId}`);
  redirect(`/students/${data.studentId}/reports/${r.id}`);
}

export async function publishReport(id: string, studentId: string) {
  await prisma.reportCard.update({
    where: { id },
    data: { publishedAt: new Date() },
  });
  revalidatePath(`/students/${studentId}/reports/${id}`);
  revalidatePath(`/students/${studentId}`);
}

export async function deleteReport(id: string, studentId: string) {
  await prisma.reportCard.delete({ where: { id } });
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function computeAttendancePct(
  studentId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const records = await prisma.attendanceRecord.findMany({
    where: {
      studentId,
      session: { date: { gte: periodStart, lte: periodEnd } },
    },
    select: { status: true },
  });
  if (records.length === 0) return null;
  const present = records.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;
  return Math.round((present / records.length) * 100);
}
