"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { COHORTS, COHORT_META, DEFAULT_COHORT } from "@/lib/curriculum";
import type { CurriculumCohort } from "@prisma/client";

export function parseCohort(raw: string | null | undefined): CurriculumCohort {
  if (raw && (COHORTS as readonly string[]).includes(raw.toUpperCase())) {
    return raw.toUpperCase() as CurriculumCohort;
  }
  return DEFAULT_COHORT;
}

interface Props {
  active: CurriculumCohort;
}

export function CohortTabs({ active }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function select(c: CurriculumCohort) {
    const next = new URLSearchParams(params?.toString());
    if (c === DEFAULT_COHORT) {
      next.delete("cohort");
    } else {
      next.set("cohort", c.toLowerCase());
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="inline-flex bg-mute-4 rounded-[var(--radius)] p-1 gap-1">
      {COHORTS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => select(c)}
          className={cn(
            "px-3 py-1.5 text-[13px] font-semibold rounded-[6px] transition-colors",
            active === c
              ? "bg-card text-foreground shadow-card"
              : "text-mute-1 hover:text-foreground"
          )}
        >
          {COHORT_META[c].label}
        </button>
      ))}
    </div>
  );
}
