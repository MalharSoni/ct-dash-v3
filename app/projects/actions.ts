"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";
import type { ProjectStatus } from "@prisma/client";

const STATUSES = [
  "PLANNING",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
] as const satisfies readonly ProjectStatus[];

const projectSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional().nullable(),
  status: z.enum(STATUSES).default("PLANNING"),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
});

export async function createProject(input: unknown) {
  const data = projectSchema.parse(input);
  const coach = await getCurrentCoach();
  const p = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: coach.id,
    },
  });
  revalidatePath("/projects");
  redirect(`/projects/${p.id}`);
}

export async function updateProject(id: string, input: unknown) {
  const data = projectSchema.parse(input);
  await prisma.project.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function setProjectStatus(id: string, status: ProjectStatus) {
  if (!STATUSES.includes(status)) throw new Error("Invalid status");
  await prisma.project.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function deactivateProject(id: string) {
  await prisma.project.update({ where: { id }, data: { active: false } });
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function addMember(projectId: string, studentId: string, role?: string) {
  await prisma.projectMember.upsert({
    where: { projectId_studentId: { projectId, studentId } },
    create: { projectId, studentId, role: role || null },
    update: { role: role || null },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function removeMember(projectId: string, studentId: string) {
  await prisma.projectMember.delete({
    where: { projectId_studentId: { projectId, studentId } },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function logProgress(input: unknown) {
  const data = z
    .object({
      projectId: z.string(),
      weekOf: z.string(),
      notes: z.string().trim().min(1).max(2000),
      blockers: z.string().trim().max(2000).optional().nullable(),
      studentId: z.string().optional().nullable(),
    })
    .parse(input);
  const coach = await getCurrentCoach();
  // Snap weekOf to Monday (ISO start of week).
  const week = new Date(data.weekOf);
  week.setUTCHours(0, 0, 0, 0);
  await prisma.weeklyProgress.create({
    data: {
      projectId: data.projectId,
      weekOf: week,
      notes: data.notes,
      blockers: data.blockers || null,
      studentId: data.studentId || null,
      loggedById: coach.id,
    },
  });
  revalidatePath(`/projects/${data.projectId}`);
}

export async function deleteProgress(id: string, projectId: string) {
  await prisma.weeklyProgress.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}`);
}
