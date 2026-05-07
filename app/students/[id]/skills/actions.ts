"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";
import type { SkillLevel } from "@prisma/client";

const LEVELS = [
  "NONE",
  "LEARNING",
  "PROFICIENT",
  "EXPERT",
] as const satisfies readonly SkillLevel[];

export async function upsertStudentSkill(input: unknown) {
  const data = z
    .object({
      studentId: z.string(),
      skillName: z.string().trim().min(1).max(60),
      category: z.string().trim().min(1).max(30),
      level: z.enum(LEVELS),
      evidence: z.string().trim().max(500).optional().nullable(),
    })
    .parse(input);
  const coach = await getCurrentCoach();

  const skill = await prisma.skill.upsert({
    where: {
      category_name: { category: data.category, name: data.skillName },
    },
    create: { name: data.skillName, category: data.category },
    update: {},
  });

  await prisma.studentSkill.upsert({
    where: {
      studentId_skillId: { studentId: data.studentId, skillId: skill.id },
    },
    create: {
      studentId: data.studentId,
      skillId: skill.id,
      level: data.level,
      evidence: data.evidence || null,
      verifiedAt: data.level !== "NONE" ? new Date() : null,
      verifiedBy: data.level !== "NONE" ? coach.id : null,
    },
    update: {
      level: data.level,
      evidence: data.evidence || null,
      verifiedAt: data.level !== "NONE" ? new Date() : null,
      verifiedBy: data.level !== "NONE" ? coach.id : null,
    },
  });
  revalidatePath(`/students/${data.studentId}`);
}

export async function removeStudentSkill(input: unknown) {
  const data = z
    .object({
      studentId: z.string(),
      skillId: z.string(),
    })
    .parse(input);
  await prisma.studentSkill.delete({
    where: {
      studentId_skillId: { studentId: data.studentId, skillId: data.skillId },
    },
  });
  revalidatePath(`/students/${data.studentId}`);
}
