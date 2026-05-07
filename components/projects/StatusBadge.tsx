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
import { setProjectStatus } from "@/app/projects/actions";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@prisma/client";

const META: Record<ProjectStatus, { label: string; cls: string }> = {
  PLANNING: { label: "Planning", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  ACTIVE: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  COMPLETED: { label: "Completed", cls: "bg-mute-3 text-mute-1 border-mute-3" },
  ARCHIVED: { label: "Archived", cls: "bg-mute-4 text-mute-2 border-mute-3" },
};

export function ProjectStatusBadge({
  projectId,
  status,
  editable = false,
}: {
  projectId: string;
  status: ProjectStatus;
  editable?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function pick(s: ProjectStatus) {
    startTransition(async () => {
      try {
        await setProjectStatus(projectId, s);
        toast.success(`Marked ${META[s].label.toLowerCase()}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const m = META[status];

  if (!editable) {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border",
          m.cls
        )}
      >
        {m.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border hover:brightness-95",
            m.cls
          )}
        >
          {isPending ? <Loader2 size={10} className="animate-spin" /> : null}
          {m.label}
          <ChevronDown size={10} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {(Object.keys(META) as ProjectStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => pick(s)}
            disabled={s === status}
          >
            {META[s].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const PROJECT_STATUS_META = META;
