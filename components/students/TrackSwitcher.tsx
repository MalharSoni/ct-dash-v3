"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setStudentTracks } from "@/app/students/actions";
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

const ALL_TRACKS: StudentTrack[] = [
  "FOUNDATION",
  "PROJECTS",
  "GRADUATED",
  "INACTIVE",
];

// End-states that force everything else off.
const EXCLUSIVE: ReadonlySet<StudentTrack> = new Set(["GRADUATED", "INACTIVE"]);

interface Props {
  studentId: string;
  current: StudentTrack[];
}

export function TrackSwitcher({ studentId, current }: Props) {
  const [isPending, startTransition] = useTransition();
  // Optimistic local copy so the UI updates instantly while the server saves.
  const [tracks, setTracks] = useState<StudentTrack[]>(
    current.length > 0 ? current : ["FOUNDATION"]
  );

  function persist(next: StudentTrack[]) {
    setTracks(next);
    startTransition(async () => {
      try {
        await setStudentTracks(studentId, next);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update tracks");
        setTracks(current); // rollback
      }
    });
  }

  function toggle(track: StudentTrack) {
    const has = tracks.includes(track);
    let next: StudentTrack[];

    if (has) {
      next = tracks.filter((t) => t !== track);
    } else if (EXCLUSIVE.has(track)) {
      // Toggling on Graduated/Inactive — confirm and clear all others.
      const verb = track === "GRADUATED" ? "Graduate" : "Move";
      if (
        tracks.some((t) => !EXCLUSIVE.has(t)) &&
        !confirm(
          `${verb} this student to ${TRACK_LABEL[track]} only? They'll come off the active roster.`
        )
      ) {
        return;
      }
      next = [track];
    } else {
      // Adding an active track — strip out any end-states.
      next = [...tracks.filter((t) => !EXCLUSIVE.has(t)), track];
    }

    if (next.length === 0) next = ["FOUNDATION"];
    persist(next);
  }

  // Render: one badge per active track, then a "+ add" trigger if there's
  // room for more active tracks.
  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {tracks.map((t) => (
        <DropdownMenu key={t}>
          <DropdownMenuTrigger asChild disabled={isPending}>
            <button
              type="button"
              aria-label={`${TRACK_LABEL[t]} — click to change`}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border transition-colors cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                TRACK_BADGE[t],
                isPending && "opacity-60 cursor-wait"
              )}
            >
              {isPending ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <span className={cn("size-1.5 rounded-full", TRACK_DOT[t])} />
              )}
              <span>{TRACK_LABEL[t]}</span>
              <ChevronDown size={11} strokeWidth={2.5} className="opacity-70 -mr-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[180px]">
            <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.05em]">
              Tracks ({tracks.length})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_TRACKS.map((opt) => {
              const on = tracks.includes(opt);
              return (
                <DropdownMenuItem
                  key={opt}
                  onSelect={(e) => {
                    e.preventDefault();
                    toggle(opt);
                  }}
                  className="text-[13px] gap-2"
                >
                  <span className={cn("size-2 rounded-full", TRACK_DOT[opt])} />
                  <span className="flex-1">{TRACK_LABEL[opt]}</span>
                  {on && <Check size={13} className="text-foreground" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
      {/* "+" trigger when an additional active track could still be added. */}
      {tracks.length < 2 && !tracks.some((t) => EXCLUSIVE.has(t)) && (
        <AddTrack
          existing={tracks}
          onAdd={toggle}
          disabled={isPending}
        />
      )}
    </div>
  );
}

function AddTrack({
  existing,
  onAdd,
  disabled,
}: {
  existing: StudentTrack[];
  onAdd: (t: StudentTrack) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const candidates = ALL_TRACKS.filter((t) => !existing.includes(t));
  if (candidates.length === 0) return null;
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label="Add track"
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border border-dashed border-mute-2 text-mute-1 hover:text-foreground hover:border-mute-1 transition-colors cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            disabled && "opacity-60 cursor-wait"
          )}
        >
          <Plus size={10} strokeWidth={2.8} />
          <span>Add</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {candidates.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={(e) => {
              e.preventDefault();
              setOpen(false);
              onAdd(opt);
            }}
            className="text-[13px] gap-2"
          >
            <span className={cn("size-2 rounded-full", TRACK_DOT[opt])} />
            <span>{TRACK_LABEL[opt]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
