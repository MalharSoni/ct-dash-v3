import Image from "next/image";
import { CurriculumMatrix } from "@/components/curriculum/CurriculumMatrix";
import { CohortTabs } from "@/components/curriculum/CohortTabs";
import { prisma } from "@/lib/prisma";
import { PHASES, PHASE_META, parseCohort } from "@/lib/curriculum";
import { getOrgSettings } from "@/app/settings/coach-actions";
import type { WeekDTO, TimeslotDTO } from "@/components/curriculum/types";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const org = await getOrgSettings();
  return {
    title: `${org.publicHeading} · ${org.orgName}`,
  };
}

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
        cohort: e.cohort,
      })),
    })),
  };
}

export default async function PublicCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ cohort?: string }>;
}) {
  const [{ weeks, timeslots }, org, sp] = await Promise.all([
    loadData(),
    getOrgSettings(),
    searchParams,
  ]);
  const activeCohort = parseCohort(sp.cohort);

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="bg-ink">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/ctrc-white.png"
              alt={org.orgName}
              width={643}
              height={168}
              priority
              className="h-8 w-auto"
            />
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.1em] text-mute-2">
              {org.orgName}
            </div>
            <div className="text-[13px] font-bold text-white">
              {org.publicHeading}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-5">
        <div>
          <h1 className="text-page-title text-foreground">
            {org.publicHeading}
          </h1>
          {org.publicTagline && (
            <p className="text-[14px] text-mute-1 mt-1">{org.publicTagline}</p>
          )}
        </div>

        {/* Cohort tabs + phase legend */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CohortTabs active={activeCohort} />
          <div className="bg-card border border-border rounded-[var(--radius)] p-2.5 shadow-card flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-mute-1">
              Phases
            </span>
            {PHASES.map((p) => {
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
        </div>

        <CurriculumMatrix
          weeks={weeks}
          timeslots={timeslots}
          activeCohort={activeCohort}
        />

        <p className="text-[11.5px] text-mute-1 pt-4">
          Schedule is subject to change. Last updated{" "}
          {weeks.length > 0
            ? new Date().toLocaleDateString("en-CA", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—"}
          .
        </p>
      </main>
    </div>
  );
}
