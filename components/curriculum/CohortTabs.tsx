"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { COHORTS, COHORT_META, DEFAULT_COHORT } from "@/lib/curriculum";
import type { CurriculumCohort } from "@prisma/client";

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
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-mute-1">
        Program
      </span>
      <div className="inline-flex bg-mute-4 border border-border rounded-[var(--radius)] p-1 gap-1">
        {COHORTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => select(c)}
            aria-pressed={active === c}
            className={cn(
              "px-4 py-2 text-[14px] font-bold rounded-[6px] transition-all",
              active === c
                ? "bg-brand text-ink shadow-card scale-[1.02]"
                : "text-mute-1 hover:text-foreground hover:bg-card"
            )}
          >
            {COHORT_META[c].label}
          </button>
        ))}
      </div>
    </div>
  );
}
