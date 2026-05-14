import type { CurriculumPhase, CurriculumCohort } from "@prisma/client";

export const PHASE_META: Record<
  CurriculumPhase,
  { label: string; ink: string; bg: string; border: string }
> = {
  HANDS_ON: {
    label: "Hands-On",
    ink: "#B45309", // amber — kinetic, doing
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  GUIDED_LESSON: {
    label: "Guided Lesson",
    ink: "#1D4ED8", // blue — structured teaching
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  COMPETITION: {
    label: "Competition",
    ink: "#A16207", // gold yellow — scrim prep, scrim, event, provincials
    bg: "#FFFBDC",
    border: "#F5D000",
  },
  WORK_PERIOD: {
    label: "Work Period",
    ink: "#047857", // emerald — self-directed work / open lab time
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
};

export const PHASES: CurriculumPhase[] = [
  "HANDS_ON",
  "GUIDED_LESSON",
  "COMPETITION",
  "WORK_PERIOD",
];

export const COHORTS: CurriculumCohort[] = [
  "FOUNDATION",
  "V5RC",
  "V5",
  "PROJECTS",
];

// activeBg / activeInk style the selected tab in CohortTabs.
export const COHORT_META: Record<
  CurriculumCohort,
  { label: string; shortLabel: string; activeBg: string; activeInk: string }
> = {
  FOUNDATION: { label: "Foundation", shortLabel: "Foundation", activeBg: "#F5D000", activeInk: "#171717" },
  V5RC:       { label: "V5RC Team",  shortLabel: "V5RC",       activeBg: "#F5D000", activeInk: "#171717" },
  V5:         { label: "V5",         shortLabel: "V5",         activeBg: "#EF4444", activeInk: "#FFFFFF" },
  PROJECTS:   { label: "Projects",   shortLabel: "Projects",   activeBg: "#F5D000", activeInk: "#171717" },
};

export const DEFAULT_COHORT: CurriculumCohort = "V5RC";

export function parseCohort(raw: string | null | undefined): CurriculumCohort {
  if (raw && (COHORTS as readonly string[]).includes(raw.toUpperCase())) {
    return raw.toUpperCase() as CurriculumCohort;
  }
  return DEFAULT_COHORT;
}
