"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { TeamRole, TaskStatus, Priority, TeamEventType } from "@prisma/client";

const TEAM_ROLES: TeamRole[] = [
  "CAPTAIN",
  "DRIVER",
  "PROGRAMMER",
  "BUILDER",
  "STRATEGIST",
  "NOTEBOOK",
  "MEMBER",
];
const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];
const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const teamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  teamNumber: z.string().trim().min(1).max(20),
  description: z.string().trim().max(1000).optional().nullable(),
});

export async function createTeam(input: unknown) {
  const data = teamSchema.parse(input);
  const season = await prisma.season.findFirst({ where: { current: true } });
  if (!season) throw new Error("No current season — set one in Settings.");
  const t = await prisma.team.create({
    data: {
      name: data.name,
      teamNumber: data.teamNumber,
      description: data.description || null,
      seasonId: season.id,
    },
  });
  revalidatePath("/teams");
  redirect(`/teams/${t.id}`);
}

export async function updateTeam(id: string, input: unknown) {
  const data = teamSchema.parse(input);
  await prisma.team.update({
    where: { id },
    data: {
      name: data.name,
      teamNumber: data.teamNumber,
      description: data.description || null,
    },
  });
  revalidatePath("/teams");
  revalidatePath(`/teams/${id}`);
}

export async function deactivateTeam(id: string) {
  await prisma.team.update({ where: { id }, data: { active: false } });
  revalidatePath("/teams");
}

export async function addTeamMember(input: unknown) {
  const data = z
    .object({
      teamId: z.string(),
      studentId: z.string(),
      role: z.enum(TEAM_ROLES).default("MEMBER"),
    })
    .parse(input);
  await prisma.teamMember.upsert({
    where: { teamId_studentId: { teamId: data.teamId, studentId: data.studentId } },
    create: { teamId: data.teamId, studentId: data.studentId, role: data.role },
    update: { role: data.role, active: true },
  });
  revalidatePath(`/teams/${data.teamId}`);
}

export async function setMemberRole(memberId: string, role: TeamRole) {
  if (!TEAM_ROLES.includes(role)) throw new Error("Invalid role");
  const m = await prisma.teamMember.update({
    where: { id: memberId },
    data: { role },
  });
  revalidatePath(`/teams/${m.teamId}`);
}

export async function removeTeamMember(memberId: string) {
  const m = await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/teams/${m.teamId}`);
}

export async function createTask(input: unknown) {
  const data = z
    .object({
      teamId: z.string(),
      title: z.string().trim().min(1).max(120),
      description: z.string().trim().max(2000).optional().nullable(),
      status: z.enum(TASK_STATUSES).default("TODO"),
      priority: z.enum(PRIORITIES).default("MEDIUM"),
      dueDate: z.string().optional().nullable(),
      assigneeId: z.string().optional().nullable(),
    })
    .parse(input);
  await prisma.teamTask.create({
    data: {
      teamId: data.teamId,
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assigneeId: data.assigneeId || null,
    },
  });
  revalidatePath(`/teams/${data.teamId}`);
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) throw new Error("Invalid status");
  const t = await prisma.teamTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  revalidatePath(`/teams/${t.teamId}`);
}

export async function deleteTask(taskId: string) {
  const t = await prisma.teamTask.delete({ where: { id: taskId } });
  revalidatePath(`/teams/${t.teamId}`);
}

const EVENT_TYPES: TeamEventType[] = [
  "PRACTICE",
  "SCRIMMAGE",
  "COMPETITION",
  "BUILD_DAY",
  "MEETING",
  "OTHER",
];

export async function createEvent(input: unknown) {
  const data = z
    .object({
      teamId: z.string(),
      type: z.enum(EVENT_TYPES).default("PRACTICE"),
      title: z.string().trim().min(1).max(120),
      startAt: z.string().min(1),
      endAt: z.string().optional().nullable(),
      location: z.string().trim().max(120).optional().nullable(),
      notes: z.string().trim().max(1000).optional().nullable(),
    })
    .parse(input);
  await prisma.teamEvent.create({
    data: {
      teamId: data.teamId,
      type: data.type,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      location: data.location || null,
      notes: data.notes || null,
    },
  });
  revalidatePath(`/teams/${data.teamId}`);
}

export async function updateEvent(eventId: string, input: unknown) {
  const data = z
    .object({
      type: z.enum(EVENT_TYPES),
      title: z.string().trim().min(1).max(120),
      startAt: z.string().min(1),
      endAt: z.string().optional().nullable(),
      location: z.string().trim().max(120).optional().nullable(),
      notes: z.string().trim().max(1000).optional().nullable(),
    })
    .parse(input);
  const ev = await prisma.teamEvent.update({
    where: { id: eventId },
    data: {
      type: data.type,
      title: data.title,
      startAt: new Date(data.startAt),
      endAt: data.endAt ? new Date(data.endAt) : null,
      location: data.location || null,
      notes: data.notes || null,
    },
  });
  revalidatePath(`/teams/${ev.teamId}`);
}

export async function deleteEvent(eventId: string) {
  const ev = await prisma.teamEvent.delete({ where: { id: eventId } });
  revalidatePath(`/teams/${ev.teamId}`);
}
