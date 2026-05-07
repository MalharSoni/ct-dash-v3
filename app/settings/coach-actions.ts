"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { COACH_COOKIE_NAME } from "@/lib/current-coach";

export async function setActiveCoach(coachId: string) {
  const c = await prisma.coach.findUnique({ where: { id: coachId } });
  if (!c?.active) throw new Error("Coach not found or inactive");
  const jar = await cookies();
  jar.set(COACH_COOKIE_NAME, coachId, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
}

const coachUpdate = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().or(z.literal("")).optional().nullable(),
});

export async function updateCoach(id: string, input: unknown) {
  const data = coachUpdate.parse(input);
  await prisma.coach.update({
    where: { id },
    data: { name: data.name, email: data.email || null },
  });
  revalidatePath("/settings");
}

const seasonUpdate = z.object({
  name: z.string().trim().min(1).max(80),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
});

export async function updateSeason(id: string, input: unknown) {
  const data = seasonUpdate.parse(input);
  await prisma.season.update({
    where: { id },
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  revalidatePath("/settings");
}

const orgSchema = z.object({
  orgName: z.string().trim().min(1).max(80),
  publicHeading: z.string().trim().min(1).max(80),
  publicTagline: z.string().trim().max(200).optional().nullable(),
  reportFooter: z.string().trim().max(300).optional().nullable(),
});

export async function getOrgSettings() {
  let s = await prisma.orgSettings.findFirst();
  if (!s) s = await prisma.orgSettings.create({ data: {} });
  return s;
}

export async function updateOrgSettings(input: unknown) {
  const data = orgSchema.parse(input);
  const existing = await prisma.orgSettings.findFirst();
  if (existing) {
    await prisma.orgSettings.update({
      where: { id: existing.id },
      data: {
        orgName: data.orgName,
        publicHeading: data.publicHeading,
        publicTagline: data.publicTagline || "",
        reportFooter: data.reportFooter || "",
      },
    });
  } else {
    await prisma.orgSettings.create({
      data: {
        orgName: data.orgName,
        publicHeading: data.publicHeading,
        publicTagline: data.publicTagline || "",
        reportFooter: data.reportFooter || "",
      },
    });
  }
  revalidatePath("/settings");
  revalidatePath("/c");
}

const timeslotCreate = z.object({
  name: z.string().trim().min(1).max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function createTimeslot(input: unknown) {
  const data = timeslotCreate.parse(input);
  const max = await prisma.curriculumTimeslot.aggregate({
    _max: { order: true },
  });
  const order = (max._max.order ?? -1) + 1;
  await prisma.curriculumTimeslot.create({
    data: { ...data, order },
  });
  revalidatePath("/settings");
  revalidatePath("/curriculum");
  revalidatePath("/c");
}

export async function deleteTimeslot(id: string) {
  // Cascade will remove entries that referenced this column.
  await prisma.curriculumTimeslot.delete({ where: { id } });
  revalidatePath("/settings");
  revalidatePath("/curriculum");
  revalidatePath("/c");
}
