"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";
import type { AttendanceStatus } from "@prisma/client";

const STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const satisfies readonly AttendanceStatus[];

function dayOnly(d: Date) {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

export async function ensureSession(date: Date) {
  const day = dayOnly(date);
  return prisma.session.upsert({
    where: { date: day },
    create: { date: day },
    update: {},
  });
}

export async function setAttendance(input: unknown) {
  const data = z
    .object({
      sessionId: z.string(),
      studentId: z.string(),
      status: z.enum(STATUSES),
    })
    .parse(input);
  const coach = await getCurrentCoach();
  await prisma.attendanceRecord.upsert({
    where: {
      sessionId_studentId: {
        sessionId: data.sessionId,
        studentId: data.studentId,
      },
    },
    create: {
      sessionId: data.sessionId,
      studentId: data.studentId,
      status: data.status,
      recordedById: coach.id,
    },
    update: {
      status: data.status,
      recordedById: coach.id,
    },
  });
  // If marking absent, clear any existing performance rating for the day —
  // a 1-5 rating doesn't apply to a no-show.
  if (data.status === "ABSENT") {
    await prisma.dailyPerformance.deleteMany({
      where: {
        sessionId: data.sessionId,
        studentId: data.studentId,
      },
    });
  }
  revalidatePath("/attendance");
  revalidatePath(`/students/${data.studentId}`);
  revalidatePath("/");
}

export async function setPerformance(input: unknown) {
  const data = z
    .object({
      sessionId: z.string(),
      studentId: z.string(),
      rating: z.coerce.number().int().min(1).max(5),
    })
    .parse(input);
  const coach = await getCurrentCoach();
  await prisma.dailyPerformance.upsert({
    where: {
      sessionId_studentId: {
        sessionId: data.sessionId,
        studentId: data.studentId,
      },
    },
    create: {
      sessionId: data.sessionId,
      studentId: data.studentId,
      rating: data.rating,
      recordedById: coach.id,
    },
    update: {
      rating: data.rating,
      recordedById: coach.id,
    },
  });
  revalidatePath("/attendance");
  revalidatePath(`/students/${data.studentId}`);
  revalidatePath("/");
}

export async function setAttendanceNotes(input: unknown) {
  const data = z
    .object({
      sessionId: z.string(),
      studentId: z.string(),
      notes: z.string().trim().max(500).optional().nullable(),
    })
    .parse(input);
  await prisma.attendanceRecord.update({
    where: {
      sessionId_studentId: {
        sessionId: data.sessionId,
        studentId: data.studentId,
      },
    },
    data: { notes: data.notes || null },
  });
  revalidatePath("/attendance");
  revalidatePath(`/students/${data.studentId}`);
}

export async function bulkSetAttendance(input: unknown) {
  const data = z
    .object({
      sessionId: z.string(),
      studentIds: z.array(z.string()).min(1),
      status: z.enum(STATUSES),
    })
    .parse(input);
  const coach = await getCurrentCoach();
  // Use upsert in a tx so all rows are written atomically.
  await prisma.$transaction(
    data.studentIds.map((studentId) =>
      prisma.attendanceRecord.upsert({
        where: {
          sessionId_studentId: { sessionId: data.sessionId, studentId },
        },
        create: {
          sessionId: data.sessionId,
          studentId,
          status: data.status,
          recordedById: coach.id,
        },
        update: { status: data.status, recordedById: coach.id },
      })
    )
  );
  revalidatePath("/attendance");
  revalidatePath("/");
}

export async function addXFactorNote(input: unknown) {
  const data = z
    .object({
      sessionId: z.string().optional(),
      studentId: z.string(),
      note: z.string().trim().min(1).max(1000),
      tags: z.array(z.string().trim().max(30)).max(10).optional(),
    })
    .parse(input);
  const coach = await getCurrentCoach();
  await prisma.xFactorNote.create({
    data: {
      sessionId: data.sessionId,
      studentId: data.studentId,
      note: data.note,
      tags: data.tags ?? [],
      recordedById: coach.id,
    },
  });
  revalidatePath("/attendance");
  revalidatePath(`/students/${data.studentId}`);
  revalidatePath("/");
}
