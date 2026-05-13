import type { CurriculumPhase, CurriculumCohort } from "@prisma/client";

export type TimeslotDTO = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
};

export type EntryDTO = {
  id: string;
  weekId: string;
  timeslotId: string;
  title: string;
  description: string | null;
  phase: CurriculumPhase;
  cohort: CurriculumCohort;
};

export type WeekDTO = {
  id: string;
  saturday: string; // ISO
  label: string | null;
  isBreak: boolean;
  breakNote: string | null;
  notes: string | null;
  entries: EntryDTO[];
};

export type MonthThemeDTO = {
  id: string;
  yearMonth: string;       // "YYYY-MM"
  cohort: CurriculumCohort;
  title: string;
  subtitle: string | null;
};
