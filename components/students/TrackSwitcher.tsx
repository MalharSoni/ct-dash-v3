"use client";

import { useTransition } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setStudentTrack } from "@/app/students/actions";
import { cn } from "@/lib/utils";
import type { StudentTrack } from "@prisma/client";

const TRACK_BADGE: Record<StudentTrack, string> = {
  FOUNDATION: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  PROJECTS: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  GRADUATED: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  INACTIVE: "bg-mute-3 text-mute-1 border-mute-3 hover:bg-mute-3/80",
};

const TRACK_LABEL: Record<StudentTrack, string> = {
  FOUNDATION: "Foundation",
  PROJECTS: "Projects",
  GRADUATED: "Graduated",
  INACTIVE: "Inactive",
};

const TRACK_DOT: Record<StudentTrack, string> = {
  FOUNDATION: "bg-emerald-500",
  PROJECTS: "bg-amber-500",
  GRADUATED: "bg-blue-500",
  INACTIVE: "bg-mute-2",
};

const TRACKS: StudentTrack[] = ["FOUNDATION", "PROJECTS", "GRADUATED", "INACTIVE"];

// Tracks that take a student off the active roster — confirm before switching.
const DESTRUCTIVE: ReadonlySet<StudentTrack> = new Set(["GRADUATED", "INACTIVE"]);

interface Props {
  studentId: string;
  current: StudentTrack;
}

export function TrackSwitcher({ studentId, current }: Props) {
  const [isPending, startTransition] = useTransition();

  function change(track: StudentTrack) {
    if (track === current) return;
    if (DESTRUCTIVE.has(track) && !DESTRUCTIVE.has(current)) {
      const verb = track === "GRADUATED" ? "graduate" : "move";
      const dest = TRACK_LABEL[track];
      if (
        !confirm(
          `${verb === "graduate" ? "Graduate" : "Move"} this student to ${dest}? They'll come off the active roster.`
        )
      ) {
        return;
      }
    }
    startTransition(async () => {
      try {
        await setStudentTrack(studentId, track);
        toast.success(`Moved to ${TRACK_LABEL[track]}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update track");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        <button
          type="button"
          aria-label="Change track"
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            TRACK_BADGE[current],
            isPending && "opacity-60 cursor-wait"
          )}
        >
          {isPending ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <span className={cn("size-1.5 rounded-full", TRACK_DOT[current])} />
          )}
          <span>{TRACK_LABEL[current]}</span>
          <ChevronDown size={11} strokeWidth={2.5} className="opacity-70 -mr-0.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {TRACKS.map((t) => (
          <DropdownMenuItem
            key={t}
            onClick={() => change(t)}
            className="text-[13px] gap-2"
          >
            <span className={cn("size-2 rounded-full", TRACK_DOT[t])} />
            <span className="flex-1">{TRACK_LABEL[t]}</span>
            {t === current && (
              <Check size={13} className="text-mute-1" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
