"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";
import type { TrialStatus, StudentTrack } from "@prisma/client";

const TRIAL_STATUSES = [
  "SCHEDULED",
  "ATTENDED",
  "NO_SHOW",
  "CONVERTED",
  "DECLINED",
] as const satisfies readonly TrialStatus[];

const trialSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  parentName: z.string().trim().max(80).optional().nullable(),
  parentEmail: z.string().trim().email().or(z.literal("")).optional().nullable(),
  parentPhone: z.string().trim().max(30).optional().nullable(),
  grade: z.coerce.number().int().min(1).max(13).optional().nullable(),
  scheduledAt: z.string().min(1), // ISO yyyy-MM-ddTHH:mm
  timeslot: z.string().trim().min(1).max(40),
  notes: z.string().trim().max(1000).optional().nullable(),
});

const assessmentSchema = z.object({
  enthusiasm: z.coerce.number().int().min(1).max(5),
  capability: z.coerce.number().int().min(1).max(5),
  fitNotes: z.string().trim().min(1).max(2000),
  recommend: z.boolean(),
});

function clean<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out;
}

export async function createTrial(input: unknown) {
  const data = trialSchema.parse(input);
  const t = await prisma.trialStudent.create({
    data: { ...clean(data), scheduledAt: new Date(data.scheduledAt) } as never,
  });
  revalidatePath("/trial-students");
  revalidatePath("/");
  redirect(`/trial-students/${t.id}`);
}

export async function updateTrial(id: string, input: unknown) {
  const data = trialSchema.parse(input);
  await prisma.trialStudent.update({
    where: { id },
    data: { ...clean(data), scheduledAt: new Date(data.scheduledAt) } as never,
  });
  revalidatePath("/trial-students");
  revalidatePath(`/trial-students/${id}`);
  revalidatePath("/");
}

export async function setTrialStatus(id: string, status: TrialStatus) {
  if (!TRIAL_STATUSES.includes(status)) throw new Error("Invalid status");
  await prisma.trialStudent.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/trial-students");
  revalidatePath(`/trial-students/${id}`);
  revalidatePath("/");
}

export async function deleteTrial(id: string) {
  await prisma.trialStudent.delete({ where: { id } });
  revalidatePath("/trial-students");
  revalidatePath("/");
  redirect("/trial-students");
}

export async function convertTrialToStudent(input: unknown) {
  const data = z
    .object({
      trialId: z.string(),
      track: z.enum([
        "FOUNDATION",
        "PROJECTS",
        "GRADUATED",
        "INACTIVE",
      ] as const satisfies readonly StudentTrack[]),
    })
    .parse(input);

  const trial = await prisma.trialStudent.findUnique({
    where: { id: data.trialId },
  });
  if (!trial) throw new Error("Trial not found");

  // Check for an existing student with the same name to avoid duplicates.
  const existing = await prisma.student.findFirst({
    where: { firstName: trial.firstName, lastName: trial.lastName },
  });
  if (existing) {
    throw new Error(
      `A student named "${trial.firstName} ${trial.lastName}" already exists.`
    );
  }

  const student = await prisma.student.create({
    data: {
      firstName: trial.firstName,
      lastName: trial.lastName,
      parentName: trial.parentName,
      parentEmail: trial.parentEmail,
      parentPhone: trial.parentPhone,
      grade: trial.grade,
      track: data.track,
      notes: trial.notes,
    },
  });

  await prisma.trialStudent.update({
    where: { id: data.trialId },
    data: { status: "CONVERTED" },
  });

  revalidatePath("/trial-students");
  revalidatePath(`/trial-students/${data.trialId}`);
  revalidatePath("/students");
  revalidatePath("/foundation");
  revalidatePath("/");

  redirect(`/students/${student.id}`);
}

export async function submitAssessment(trialStudentId: string, input: unknown) {
  const data = assessmentSchema.parse(input);
  const coach = await getCurrentCoach();
  await prisma.trialAssessment.upsert({
    where: { trialStudentId },
    create: { trialStudentId, coachId: coach.id, ...data },
    update: { coachId: coach.id, ...data, submittedAt: new Date() },
  });
  // Mark trial attended if it was still scheduled.
  await prisma.trialStudent.update({
    where: { id: trialStudentId },
    data: { status: "ATTENDED" },
  });
  revalidatePath(`/trial-students/${trialStudentId}`);
  revalidatePath("/trial-students");
}
