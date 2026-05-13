"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PHASES = ["HANDS_ON", "GUIDED_LESSON"] as const;

const COHORTS = ["FOUNDATION", "V5RC", "PROJECTS"] as const;

const entrySchema = z.object({
  weekId: z.string().min(1),
  timeslotId: z.string().min(1),
  title: z.string().trim().min(1, "Title required").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  phase: z.enum(PHASES),
  cohort: z.enum(COHORTS).default("V5RC"),
});

const weekSchema = z.object({
  saturday: z.string().min(1), // ISO date string
  label: z.string().trim().max(80).optional().nullable(),
});

const breakSchema = z.object({
  weekId: z.string(),
  isBreak: z.boolean(),
  breakNote: z.string().trim().max(120).optional().nullable(),
});

const timeslotSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "HH:MM"),
});

function revalidate() {
  revalidatePath("/curriculum");
  revalidatePath("/c");
}

export async function addWeek(input: unknown) {
  const data = weekSchema.parse(input);
  const saturday = new Date(data.saturday);
  // Normalize to midnight UTC so unique constraint works cleanly
  saturday.setUTCHours(0, 0, 0, 0);

  await prisma.curriculumWeek.upsert({
    where: { saturday },
    create: { saturday, label: data.label || null },
    update: { label: data.label || null },
  });
  revalidate();
}

export async function updateWeek(input: unknown) {
  const data = z
    .object({
      id: z.string(),
      saturday: z.string().min(1),
      label: z.string().trim().max(80).optional().nullable(),
    })
    .parse(input);
  const sat = new Date(data.saturday);
  sat.setUTCHours(0, 0, 0, 0);
  await prisma.curriculumWeek.update({
    where: { id: data.id },
    data: { saturday: sat, label: data.label || null },
  });
  revalidate();
}

export async function duplicateWeek(input: unknown) {
  const data = z
    .object({ sourceWeekId: z.string(), targetSaturday: z.string() })
    .parse(input);
  const source = await prisma.curriculumWeek.findUnique({
    where: { id: data.sourceWeekId },
    include: { entries: true },
  });
  if (!source) throw new Error("Source week not found");

  const targetDate = new Date(data.targetSaturday);
  targetDate.setUTCHours(0, 0, 0, 0);

  const target = await prisma.curriculumWeek.upsert({
    where: { saturday: targetDate },
    create: { saturday: targetDate },
    update: {},
  });

  // Copy each entry to the target week (overwriting existing on conflict).
  for (const e of source.entries) {
    await prisma.curriculumEntry.upsert({
      where: {
        weekId_timeslotId_cohort: {
          weekId: target.id,
          timeslotId: e.timeslotId,
          cohort: e.cohort,
        },
      },
      create: {
        weekId: target.id,
        timeslotId: e.timeslotId,
        title: e.title,
        description: e.description,
        phase: e.phase,
        cohort: e.cohort,
      },
      update: {
        title: e.title,
        description: e.description,
        phase: e.phase,
      },
    });
  }

  revalidate();
  return target.id;
}

export async function removeWeek(weekId: string) {
  await prisma.curriculumWeek.delete({ where: { id: weekId } });
  revalidate();
}

export async function toggleBreak(input: unknown) {
  const data = breakSchema.parse(input);
  await prisma.curriculumWeek.update({
    where: { id: data.weekId },
    data: {
      isBreak: data.isBreak,
      breakNote: data.isBreak ? data.breakNote || null : null,
    },
  });
  revalidate();
}

export async function upsertEntry(input: unknown) {
  const data = entrySchema.parse(input);
  await prisma.curriculumEntry.upsert({
    where: {
      weekId_timeslotId_cohort: {
        weekId: data.weekId,
        timeslotId: data.timeslotId,
        cohort: data.cohort,
      },
    },
    create: {
      weekId: data.weekId,
      timeslotId: data.timeslotId,
      title: data.title,
      description: data.description || null,
      phase: data.phase,
      cohort: data.cohort,
    },
    update: {
      title: data.title,
      description: data.description || null,
      phase: data.phase,
    },
  });
  revalidate();
}

export async function removeEntry(entryId: string) {
  await prisma.curriculumEntry.delete({ where: { id: entryId } });
  revalidate();
}

/**
 * Move a curriculum entry to a different (week, timeslot) cell. Cohort
 * is preserved — the same cohort's entry at the destination is swapped.
 * Drag-and-drop only operates within a single cohort tab at a time.
 */
export async function moveEntry(input: unknown) {
  const data = z
    .object({
      entryId: z.string(),
      targetWeekId: z.string(),
      targetTimeslotId: z.string(),
    })
    .parse(input);

  const source = await prisma.curriculumEntry.findUnique({
    where: { id: data.entryId },
  });
  if (!source) throw new Error("Entry not found");

  // Same cell — no-op.
  if (
    source.weekId === data.targetWeekId &&
    source.timeslotId === data.targetTimeslotId
  ) {
    return;
  }

  const dest = await prisma.curriculumEntry.findUnique({
    where: {
      weekId_timeslotId_cohort: {
        weekId: data.targetWeekId,
        timeslotId: data.targetTimeslotId,
        cohort: source.cohort,
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    if (dest) {
      // Swap within the same cohort.
      await tx.curriculumEntry.delete({ where: { id: source.id } });
      await tx.curriculumEntry.delete({ where: { id: dest.id } });
      await tx.curriculumEntry.create({
        data: {
          weekId: data.targetWeekId,
          timeslotId: data.targetTimeslotId,
          title: source.title,
          description: source.description,
          phase: source.phase,
          cohort: source.cohort,
        },
      });
      await tx.curriculumEntry.create({
        data: {
          weekId: source.weekId,
          timeslotId: source.timeslotId,
          title: dest.title,
          description: dest.description,
          phase: dest.phase,
          cohort: dest.cohort,
        },
      });
    } else {
      await tx.curriculumEntry.update({
        where: { id: source.id },
        data: {
          weekId: data.targetWeekId,
          timeslotId: data.targetTimeslotId,
        },
      });
    }
  });

  revalidate();
}

/**
 * Bulk-import a curriculum from a CSV string.
 *
 * Format (header row required):
 *   saturday,timeslot,cohort,phase,title,description
 *   (older format saturday,timeslot,title,phase,description still works;
 *    rows default to cohort=V5RC)
 *
 * Rules:
 *   - `saturday` is YYYY-MM-DD.
 *   - `timeslot` matches an existing CurriculumTimeslot.name (case-insensitive).
 *   - `cohort` is FOUNDATION, V5RC, or PROJECTS (defaults to V5RC if missing).
 *   - `phase` is one of HANDS_ON, GUIDED_LESSON, or BREAK to mark the
 *     whole row as a break.
 *   - For BREAK rows, leave `timeslot` empty; `description` becomes breakNote.
 *   - Existing weeks/entries are upserted, not duplicated.
 */
export async function importCurriculumCSV(csv: string) {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must have a header and at least one row.");

  const header = lines[0].toLowerCase().split(",").map((c) => c.trim());
  const idx = (col: string) => header.indexOf(col);
  const iSat = idx("saturday");
  const iTs = idx("timeslot");
  const iTitle = idx("title");
  const iPhase = idx("phase");
  const iDesc = idx("description");
  const iCohort = idx("cohort");
  if (iSat < 0 || iPhase < 0)
    throw new Error("Header must include `saturday` and `phase` columns.");

  const timeslots = await prisma.curriculumTimeslot.findMany();
  const tsByName = new Map(
    timeslots.map((t) => [t.name.toLowerCase(), t.id])
  );

  const PHASES_VALID = new Set(["HANDS_ON", "GUIDED_LESSON"]);
  const COHORTS_VALID = new Set(["FOUNDATION", "V5RC", "PROJECTS"]);

  function parseRow(raw: string) {
    // Minimal CSV parser supporting quoted fields with commas.
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (inQuotes) {
        if (ch === '"') {
          if (raw[i + 1] === '"') {
            cur += '"';
            i++;
          } else inQuotes = false;
        } else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") {
          out.push(cur);
          cur = "";
        } else cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  }

  let weeksUpserted = 0;
  let entriesUpserted = 0;
  let breaks = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    const sat = cols[iSat];
    const phaseRaw = (cols[iPhase] ?? "").toUpperCase();
    const tsRaw = iTs >= 0 ? cols[iTs] ?? "" : "";
    const title = iTitle >= 0 ? cols[iTitle] ?? "" : "";
    const desc = iDesc >= 0 ? cols[iDesc] ?? "" : "";
    const cohortRaw = iCohort >= 0 ? (cols[iCohort] ?? "").toUpperCase() : "V5RC";

    if (!sat || !/^\d{4}-\d{2}-\d{2}$/.test(sat)) {
      errors.push(`Row ${i + 1}: invalid saturday "${sat}"`);
      continue;
    }

    const saturday = new Date(`${sat}T00:00:00Z`);

    const week = await prisma.curriculumWeek.upsert({
      where: { saturday },
      create: { saturday },
      update: {},
    });
    weeksUpserted++;

    if (phaseRaw === "BREAK") {
      await prisma.curriculumWeek.update({
        where: { id: week.id },
        data: { isBreak: true, breakNote: desc || title || "Break" },
      });
      breaks++;
      continue;
    }

    if (!PHASES_VALID.has(phaseRaw)) {
      errors.push(
        `Row ${i + 1}: invalid phase "${phaseRaw}" (allowed: HANDS_ON, GUIDED_LESSON, BREAK)`
      );
      continue;
    }

    if (!title) {
      errors.push(`Row ${i + 1}: title required for non-break rows`);
      continue;
    }

    const tsId = tsRaw && tsByName.get(tsRaw.toLowerCase());
    if (!tsId) {
      errors.push(
        `Row ${i + 1}: timeslot "${tsRaw}" not found. Existing: ${timeslots
          .map((t) => t.name)
          .join(" / ")}`
      );
      continue;
    }

    const cohort = (COHORTS_VALID.has(cohortRaw) ? cohortRaw : "V5RC") as
      "FOUNDATION" | "V5RC" | "PROJECTS";

    await prisma.curriculumEntry.upsert({
      where: {
        weekId_timeslotId_cohort: { weekId: week.id, timeslotId: tsId, cohort },
      },
      create: {
        weekId: week.id,
        timeslotId: tsId,
        title,
        description: desc || null,
        phase: phaseRaw as "HANDS_ON" | "GUIDED_LESSON",
        cohort,
      },
      update: {
        title,
        description: desc || null,
        phase: phaseRaw as "HANDS_ON" | "GUIDED_LESSON",
      },
    });
    entriesUpserted++;
  }

  revalidate();
  return { weeksUpserted, entriesUpserted, breaks, errors };
}

export async function renameTimeslot(input: unknown) {
  const data = timeslotSchema.parse(input);
  await prisma.curriculumTimeslot.update({
    where: { id: data.id },
    data: { name: data.name, startTime: data.startTime, endTime: data.endTime },
  });
  revalidate();
}
