import type { CurriculumPhase, CurriculumCohort } from "@prisma/client";

export const PHASE_META: Record<
  CurriculumPhase,
  { label: string; ink: string; bg: string; border: string }
> = {
  FOUNDATION: {
    label: "Foundation",
    ink: "#047857", // emerald
    bg: "#ECFDF5",
    border: "#A7F3D0",
  },
  VRC: {
    label: "VRC",
    ink: "#1D4ED8", // blue
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  PROJECT: {
    label: "Project",
    ink: "#B45309", // amber
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  COMPETITION: {
    label: "Competition",
    ink: "#BE123C", // rose
    bg: "#FEF2F2",
    border: "#FECACA",
  },
  GENERAL: {
    label: "General",
    ink: "#475569", // slate
    bg: "#F5F5F5",
    border: "#D4D4D4",
  },
};

export const PHASES: CurriculumPhase[] = [
  "FOUNDATION",
  "VRC",
  "PROJECT",
  "COMPETITION",
  "GENERAL",
];

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
