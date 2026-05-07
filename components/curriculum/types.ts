import type { CurriculumPhase } from "@prisma/client";

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
