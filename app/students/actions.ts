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
    data: { ...clean(data), tracks: [data.track] } as never,
  });
  revalidatePath("/students");
  revalidatePath("/foundation");
  redirect(`/students/${student.id}`);
}

export async function updateStudent(id: string, input: unknown) {
  const data = schema.parse(input);
  // Preserve any extra tracks the student already has — only ensure the form's
  // primary track is included. Coaches change multi-select via the inline
  // TrackSwitcher, not this form.
  const existing = await prisma.student.findUnique({
    where: { id },
    select: { tracks: true },
  });
  const tracks = existing
    ? Array.from(new Set([data.track, ...existing.tracks]))
    : [data.track];
  await prisma.student.update({
    where: { id },
    data: { ...clean(data), tracks } as never,
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/foundation");
}

export async function deactivateStudent(id: string) {
  await prisma.student.update({
    where: { id },
    data: { active: false, track: "INACTIVE", tracks: ["INACTIVE"] },
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

/**
 * Set the full set of tracks a student is on. The first non-end-state track
 * (i.e. not GRADUATED/INACTIVE) is mirrored into the legacy `track` column so
 * existing reads keep working. Empty arrays fall back to FOUNDATION so the DB
 * is never left in a "no track" state.
 */
function pickPrimary(tracks: StudentTrack[]): StudentTrack {
  if (tracks.length === 0) return "FOUNDATION";
  // Prefer an active track; only fall through to end-state if that's all there is.
  const active = tracks.find((t) => t !== "GRADUATED" && t !== "INACTIVE");
  return active ?? tracks[0];
}

export async function setStudentTracks(id: string, tracks: StudentTrack[]) {
  // Dedupe + drop empty.
  const next = Array.from(new Set(tracks)) as StudentTrack[];
  const safe = next.length === 0 ? (["FOUNDATION"] as StudentTrack[]) : next;
  await prisma.student.update({
    where: { id },
    data: { tracks: safe, track: pickPrimary(safe) },
  });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/foundation");
}

/** Convenience: replace tracks with a single value. */
export async function setStudentTrack(id: string, track: StudentTrack) {
  await setStudentTracks(id, [track]);
}

export async function bulkSetStudentTrack(ids: string[], track: StudentTrack) {
  if (ids.length === 0) return;
  await prisma.student.updateMany({
    where: { id: { in: ids } },
    data: { track, tracks: [track] },
  });
  revalidatePath("/students");
  revalidatePath("/foundation");
  for (const id of ids) revalidatePath(`/students/${id}`);
}
