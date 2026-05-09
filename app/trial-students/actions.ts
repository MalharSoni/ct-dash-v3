"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";
import type {
  TrialStatus,
  StudentTrack,
  CommPreference,
  StemExperience,
  ReferralSource,
} from "@prisma/client";

const TRIAL_STATUSES = [
  "SCHEDULED",
  "ATTENDED",
  "NO_SHOW",
  "CONVERTED",
  "DECLINED",
] as const satisfies readonly TrialStatus[];

const COMM_PREFS = [
  "WHATSAPP",
  "WECHAT",
] as const satisfies readonly CommPreference[];

const STEM_EXPERIENCES = [
  "NONE",
  "SOME",
  "EXPERIENCED",
] as const satisfies readonly StemExperience[];

const REFERRAL_SOURCES = [
  "FRIEND",
  "GOOGLE",
  "SOCIAL_MEDIA",
  "SCHOOL",
  "EVENT",
  "RETURNING",
  "OTHER",
] as const satisfies readonly ReferralSource[];

const trialSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  parentName: z.string().trim().max(80).optional().nullable(),
  parentEmail: z.string().trim().email().or(z.literal("")).optional().nullable(),
  parentPhone: z.string().trim().max(30).optional().nullable(),
  parentWechat: z.string().trim().max(80).optional().nullable(),
  commPref: z.enum(COMM_PREFS),
  grade: z.coerce.number().int().min(1).max(13).optional().nullable(),
  birthdate: z.string().optional().nullable(),
  currentSchool: z.string().trim().max(120).optional().nullable(),
  stemExperience: z.enum(STEM_EXPERIENCES).optional().nullable(),
  stemDetails: z.string().trim().max(500).optional().nullable(),
  referralSource: z.enum(REFERRAL_SOURCES).optional().nullable(),
  referralDetails: z.string().trim().max(200).optional().nullable(),
  // yyyy-MM-dd from a <input type="date">. We attach the timeslot label
  // as the human-readable time of day; no clock time is collected.
  scheduledAt: z.string().min(1),
  timeslot: z.string().trim().min(1).max(40),
});

const assessmentSchema = z.object({
  enthusiasm: z.coerce.number().int().min(1).max(5),
  capability: z.coerce.number().int().min(1).max(5),
  challenge: z.coerce.number().int().min(1).max(5),
  attention: z.coerce.number().int().min(1).max(5),
  questioning: z.coerce.number().int().min(1).max(5),
  vexKnowledge: z.coerce.number().int().min(1).max(5),
  problemSolving: z.coerce.number().int().min(1).max(5),
  fitNotes: z.string().trim().min(1).max(2000),
  recommend: z.boolean(),
});

function clean<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v === "" ? null : v;
  return out;
}

/** "2026-05-09" → Date at local midday (avoids timezone-rolling to prev day). */
function parseLocalDate(s: string): Date {
  // Accept either yyyy-MM-dd (date-only) or full ISO; both end up at local noon.
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /T/.test(s)) return d;
  const [y, m, day] = s.split("-").map((n) => Number(n));
  return new Date(y, (m ?? 1) - 1, day ?? 1, 12, 0, 0, 0);
}

function withDates(data: z.infer<typeof trialSchema>) {
  const cleaned = clean(data) as Record<string, unknown>;
  cleaned.scheduledAt = parseLocalDate(data.scheduledAt);
  cleaned.birthdate = data.birthdate ? parseLocalDate(data.birthdate) : null;
  return cleaned;
}

export async function createTrial(input: unknown) {
  const data = trialSchema.parse(input);
  const t = await prisma.trialStudent.create({
    data: withDates(data) as never,
  });
  revalidatePath("/trial-students");
  revalidatePath("/");
  redirect(`/trial-students/${t.id}`);
}

export async function updateTrial(id: string, input: unknown) {
  const data = trialSchema.parse(input);
  await prisma.trialStudent.update({
    where: { id },
    data: withDates(data) as never,
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
      parentWechat: trial.parentWechat,
      commPref: trial.commPref,
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

