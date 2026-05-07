"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const seasonSchema = z.object({
  name: z.string().trim().min(1).max(80),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
});

export async function createSeason(input: unknown) {
  const data = seasonSchema.parse(input);
  await prisma.season.create({
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      current: false,
    },
  });
  revalidatePath("/settings");
}

export async function setCurrentSeason(seasonId: string) {
  await prisma.$transaction([
    prisma.season.updateMany({
      where: { current: true },
      data: { current: false },
    }),
    prisma.season.update({
      where: { id: seasonId },
      data: { current: true },
    }),
  ]);
  revalidatePath("/settings");
  revalidatePath("/teams");
  revalidatePath("/");
}

export async function deleteSeason(seasonId: string) {
  await prisma.season.delete({ where: { id: seasonId } });
  revalidatePath("/settings");
}

const coachSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().or(z.literal("")).optional().nullable(),
});

export async function createCoach(input: unknown) {
  const data = coachSchema.parse(input);
  await prisma.coach.create({
    data: {
      name: data.name,
      email: data.email || null,
    },
  });
  revalidatePath("/settings");
}

export async function deactivateCoach(id: string) {
  await prisma.coach.update({ where: { id }, data: { active: false } });
  revalidatePath("/settings");
}

export async function reactivateCoach(id: string) {
  await prisma.coach.update({ where: { id }, data: { active: true } });
  revalidatePath("/settings");
}
