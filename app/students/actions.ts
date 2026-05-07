"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { StudentTrack } from "@prisma/client";

const TRACKS = [
  "FOUNDATION",
  "PROJECTS",
  "GRADUATED",
  "INACTIVE",
] as const satisfies readonly StudentTrack[];

const schema = z.object({
  firstName: z.string().trim().min(1, "First name required").max(60),
  lastName: z.string().trim().min(1, "Last name required").max(60),
  email: z.string().trim().email().or(z.literal("")).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  parentName: z.string().trim().max(80).optional().nullable(),
  parentEmail: z
    .string()
    .trim()
    .email()
    .or(z.literal(""))
    .optional()
    .nullable(),
  parentPhone: z.string().trim().max(30).optional().nullable(),
  grade: z
    .union([z.coerce.number().int().min(1).max(13), z.literal(null), z.literal("")])
    .optional()
    .nullable(),
  gradYear: z
    .union([z.coerce.number().int().min(2024).max(2040), z.literal(null), z.literal("")])
    .optional()
    .nullable(),
  track: z.enum(TRACKS),
  notes: z.string().trim().max(2000).optional().nullable(),
});

function clean<T extends Record<string, unknown>>(obj: T) {
  // Convert empty strings to null for optional fields.
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out;
}

export async function createStudent(input: unknown) {
  const data = schema.parse(input);
  const student = await prisma.student.create({
    data: clean(data) as never,
  });
  revalidatePath("/students");
  revalidatePath("/foundation");
  redirect(`/students/${student.id}`);
}

export async function updateStudent(id: string, input: unknown) {
  const data = schema.parse(input);
  await prisma.student.update({
    where: { id },
    data: clean(data) as never,
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/foundation");
}

export async function deactivateStudent(id: string) {
  await prisma.student.update({
    where: { id },
    data: { active: false, track: "INACTIVE" },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/foundation");
}

export async function reactivateStudent(id: string) {
  await prisma.student.update({
    where: { id },
    data: { active: true },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}

export async function setStudentTrack(id: string, track: StudentTrack) {
  await prisma.student.update({
    where: { id },
    data: { track },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/foundation");
}

export async function bulkSetStudentTrack(ids: string[], track: StudentTrack) {
  if (ids.length === 0) return;
  await prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { track },
  });
  revalidatePath("/students");
  revalidatePath("/foundation");
  for (const id of ids) revalidatePath(`/students/${id}`);
}
