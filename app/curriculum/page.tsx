import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { CurriculumMatrix } from "@/components/curriculum/CurriculumMatrix";
import { AddWeekDialog } from "@/components/curriculum/AddWeekDialog";
import { ImportDialog } from "@/components/curriculum/ImportDialog";
import { prisma } from "@/lib/prisma";
import { PHASES, PHASE_META } from "@/lib/curriculum";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { WeekDTO, TimeslotDTO } from "@/components/curriculum/types";

export const dynamic = "force-dynamic";

async function loadData(): Promise<{ weeks: WeekDTO[]; timeslots: TimeslotDTO[] }> {
  const [timeslots, weeks] = await Promise.all([
    prisma.curriculumTimeslot.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.curriculumWeek.findMany({
      orderBy: { saturday: "asc" },
      include: { entries: true },
    }),
  ]);

  return {
    timeslots: timeslots.map((t) => ({
      id: t.id,
      name: t.name,
      startTime: t.startTime,
      endTime: t.endTime,
      order: t.order,
    })),
    weeks: weeks.map((w) => ({
      id: w.id,
      saturday: w.saturday.toISOString(),
      label: w.label,
      isBreak: w.isBreak,
      breakNote: w.breakNote,
      notes: w.notes,
      entries: w.entries.map((e) => ({
        id: e.id,
        weekId: e.weekId,
        timeslotId: e.timeslotId,
        title: e.title,
        description: e.description,
        phase: e.phase,
      })),
    })),
  };
}

export default async function CurriculumPage() {
  const { weeks, timeslots } = await loadData();

  return (
    <AppShell
      title="Curriculum"
      actions={
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href="/c" target="_blank">
              <ExternalLink size={14} /> Public link
            </Link>
          </Button>
          <ImportDialog />
          <AddWeekDialog />
        </>
      }
    >
      <div className="space-y-4">
        {/* Phase legend */}
        <div className="bg-card border border-border rounded-[var(--radius)] p-3 shadow-card flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-mute-1">
            Phases
          </span>
          {PHASES.filter((p) => p !== "GENERAL").map((p) => {
            const m = PHASE_META[p];
            return (
              <div key={p} className="flex items-center gap-1.5 text-[12px]">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: m.ink }}
                />
                <span className="text-foreground">{m.label}</span>
              </div>
            );
          })}
        </div>

        <CurriculumMatrix
          weeks={weeks}
          timeslots={timeslots}
          editable
        />

        <p className="text-[12px] text-mute-1">
          Click any cell to add or edit a lesson. Use the row menu (⋯) to mark
          a Saturday as a break or remove it.
        </p>
      </div>
    </AppShell>
  );
}
