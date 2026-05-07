"use client";

import { useTransition } from "react";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { convertTrialToStudent } from "@/app/trial-students/actions";
import type { StudentTrack } from "@prisma/client";

interface Props {
  trialId: string;
  trialName: string;
  alreadyConverted: boolean;
}

export function ConvertButton({ trialId, trialName, alreadyConverted }: Props) {
  const [isPending, startTransition] = useTransition();

  function convert(track: StudentTrack, label: string) {
    startTransition(async () => {
      try {
        await convertTrialToStudent({ trialId, track });
        toast.success(`${trialName} enrolled as ${label}`);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  if (alreadyConverted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ArrowRight size={13} /> Already enrolled
      </Button>
    );
  }

  return (
    <div className="inline-flex rounded-[var(--radius-sm)] shadow-card overflow-hidden">
      <Button
        size="sm"
        onClick={() => convert("FOUNDATION", "Foundation")}
        disabled={isPending}
        className="rounded-r-none"
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <ArrowRight size={13} />
        )}
        Enroll as Foundation
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            disabled={isPending}
            aria-label="More enrollment options"
            className="rounded-l-none border-l border-brand-dim/40 px-2"
          >
            <ChevronDown size={13} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.05em]">
            Enroll on track
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => convert("FOUNDATION", "Foundation")}>
            Foundation
            <span className="ml-auto text-[10.5px] text-mute-1">default</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => convert("PROJECTS", "Projects")}>
            Projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
