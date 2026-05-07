import type { CurriculumPhase } from "@prisma/client";

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
