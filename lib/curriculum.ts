import type {
  CurriculumPhase,
  CurriculumCohort,
  LessonTrack,
} from "@prisma/client";

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

export const LESSON_TRACKS: LessonTrack[] = ["FOUNDATION", "V5", "PROJECT"];

// Guided lessons in the LESSONS tab carry a track. When set, the card uses
// this label + color instead of the generic blue "Guided Lesson" so the
// three streams are easy to tell apart at a glance.
export const LESSON_TRACK_META: Record<
  LessonTrack,
  { label: string; ink: string; bg: string; border: string }
> = {
  FOUNDATION: {
    label: "Foundation Guided Lesson",
    ink: "#1D4ED8", // blue
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  V5: {
    label: "V5 Guided Lesson",
    ink: "#7C3AED", // violet
    bg: "#F5F3FF",
    border: "#DDD6FE",
  },
  PROJECT: {
    label: "Project Guided Lesson",
    ink: "#0891B2", // cyan
    bg: "#ECFEFF",
    border: "#A5F3FC",
  },
};

/**
 * Resolve the visual meta for an entry — a track-specific style for guided
 * lessons that carry a lessonTrack, otherwise the plain phase style.
 */
export function entryMeta(
  phase: CurriculumPhase,
  lessonTrack: LessonTrack | null | undefined
): { label: string; ink: string; bg: string; border: string } {
  if (lessonTrack) return LESSON_TRACK_META[lessonTrack];
  return PHASE_META[phase];
}

export const COHORTS: CurriculumCohort[] = ["LESSONS", "V5RC", "PROJECTS"];

export const COHORT_META: Record<CurriculumCohort, { label: string; shortLabel: string }> = {
  LESSONS:  { label: "Lessons",   shortLabel: "Lessons" },
  V5RC:     { label: "V5RC Team", shortLabel: "V5RC" },
  PROJECTS: { label: "Projects",  shortLabel: "Projects" },
};

export const DEFAULT_COHORT: CurriculumCohort = "V5RC";

export function parseCohort(raw: string | null | undefined): CurriculumCohort {
  if (raw && (COHORTS as readonly string[]).includes(raw.toUpperCase())) {
    return raw.toUpperCase() as CurriculumCohort;
  }
  return DEFAULT_COHORT;
}
