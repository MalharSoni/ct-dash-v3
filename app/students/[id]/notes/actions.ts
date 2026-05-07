"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";

export async function addCoachNote(input: unknown) {
  const data = z
    .object({
      studentId: z.string(),
      body: z.string().trim().min(1).max(2000),
      pinned: z.boolean().optional(),
    })
    .parse(input);
  const coach = await getCurrentCoach();
  await prisma.coachNote.create({
    data: {
      studentId: data.studentId,
      coachId: coach.id,
      body: data.body,
      pinned: data.pinned ?? false,
    },
  });
  revalidatePath(`/students/${data.studentId}`);
}

export async function deleteCoachNote(id: string, studentId: string) {
  await prisma.coachNote.delete({ where: { id } });
  revalidatePath(`/students/${studentId}`);
}

export async function togglePinNote(id: string, studentId: string) {
  const note = await prisma.coachNote.findUnique({ where: { id } });
  if (!note) return;
  await prisma.coachNote.update({
    where: { id },
    data: { pinned: !note.pinned },
  });
  revalidatePath(`/students/${studentId}`);
}
