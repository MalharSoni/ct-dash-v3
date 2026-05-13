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
    ink: "#BE123C", // red — scrim, event, provincials
    bg: "#FEF2F2",
    border: "#FECACA",
  },
};

export const PHASES: CurriculumPhase[] = ["HANDS_ON", "GUIDED_LESSON", "COMPETITION"];

export const COHORTS: CurriculumCohort[] = ["FOUNDATION", "V5RC", "PROJECTS"];

export const COHORT_META: Record<CurriculumCohort, { label: string; shortLabel: string }> = {
  FOUNDATION: { label: "Foundation", shortLabel: "Foundation" },
  V5RC:       { label: "V5RC Team",  shortLabel: "V5RC" },
  PROJECTS:   { label: "Projects",   shortLabel: "Projects" },
};

export const DEFAULT_COHORT: CurriculumCohort = "V5RC";

export function parseCohort(raw: string | null | undefined): CurriculumCohort {
  if (raw && (COHORTS as readonly string[]).includes(raw.toUpperCase())) {
    return raw.toUpperCase() as CurriculumCohort;
  }
  return DEFAULT_COHORT;
}
