"use client";

import { useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setTrialStatus } from "@/app/trial-students/actions";
import { cn } from "@/lib/utils";
import type { TrialStatus } from "@prisma/client";

const META: Record<TrialStatus, { label: string; cls: string }> = {
  SCHEDULED: { label: "Scheduled", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ATTENDED: { label: "Attended", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  NO_SHOW: { label: "No-show", cls: "bg-mute-3 text-mute-1 border-mute-3" },
  CONVERTED: { label: "Joined", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  DECLINED: { label: "Declined", cls: "bg-red-50 text-red-700 border-red-200" },
};

export function TrialStatusInline({
  id,
  current,
}: {
  id: string;
  current: TrialStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function pick(s: TrialStatus) {
    if (s === current) return;
    startTransition(async () => {
      try {
        await setTrialStatus(id, s);
        toast.success(`Marked ${META[s].label.toLowerCase()}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const m = META[current];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border hover:brightness-95 transition-all",
            m.cls
          )}
        >
          {isPending ? <Loader2 size={10} className="animate-spin" /> : null}
          {m.label}
          <ChevronDown size={10} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-36">
        {(Object.keys(META) as TrialStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => pick(s)}
            disabled={s === current}
          >
            {META[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
