"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ChevronDown,
  FileStack,
  Loader2,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { bulkSetStudentTrack } from "@/app/students/actions";
import { cn } from "@/lib/utils";
import type { StudentTrack } from "@prisma/client";

const TRACK_BADGE: Record<StudentTrack, string> = {
  FOUNDATION: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROJECTS: "bg-amber-50 text-amber-700 border-amber-200",
  GRADUATED: "bg-blue-50 text-blue-700 border-blue-200",
  INACTIVE: "bg-mute-3 text-mute-1 border-mute-3",
};
const TRACK_LABEL: Record<StudentTrack, string> = {
  FOUNDATION: "Foundation",
  PROJECTS: "Projects",
  GRADUATED: "Graduated",
  INACTIVE: "Inactive",
};
const DESTRUCTIVE: ReadonlySet<StudentTrack> = new Set(["GRADUATED", "INACTIVE"]);

export interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  grade: number | null;
  track: StudentTrack;
  tracks: StudentTrack[];
  joinedAt: string; // ISO
  active: boolean;
}

interface Props {
  students: StudentRow[];
}

export function StudentsTable({ students }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allChecked = students.length > 0 && selected.size === students.length;
  const someChecked = selected.size > 0 && !allChecked;
  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(students.map((s) => s.id)));
  }

  function moveTo(track: StudentTrack) {
    if (selectedIds.length === 0) return;
    if (DESTRUCTIVE.has(track)) {
      if (
        !confirm(
          `Move ${selectedIds.length} student${selectedIds.length !== 1 ? "s" : ""} to ${TRACK_LABEL[track]}? They'll come off the active roster.`
        )
      ) {
        return;
      }
    }
    startTransition(async () => {
      try {
        await bulkSetStudentTrack(selectedIds, track);
        toast.success(`${selectedIds.length} moved to ${TRACK_LABEL[track]}`);
        setSelected(new Set());
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-[calc(var(--topbar-height)+8px)] z-30 bg-foreground text-background rounded-[var(--radius)] shadow-card-hover px-4 py-2 flex items-center gap-3 text-[13px]">
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="size-6 -ml-1 rounded-full hover:bg-background/15 inline-flex items-center justify-center"
            aria-label="Clear selection"
          >
            <XIcon size={14} />
          </button>
          <span className="font-semibold">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent text-background border-background/30 hover:bg-background/10"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <ChevronDown size={13} />
                )}
                Move to track
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuItem onClick={() => moveTo("FOUNDATION")}>
                Foundation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveTo("PROJECTS")}>
                Projects
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => moveTo("GRADUATED")}>
                Graduated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveTo("INACTIVE")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="outline"
            className="bg-transparent text-background border-background/30 hover:bg-background/10"
            asChild
          >
            <Link
              href={`/students/reports/bulk?ids=${selectedIds.join(",")}`}
            >
              <FileStack size={13} /> Generate reports
            </Link>
          </Button>
        </div>
      )}

      <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="bg-mute-4 border-b border-border text-left">
              <th className="text-table-head pl-4 pr-2 py-2.5 w-10">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="text-table-head px-4 py-2.5">Name</th>
              <th className="text-table-head px-4 py-2.5 w-20">Grade</th>
              <th className="text-table-head px-4 py-2.5 w-32">Track</th>
              <th className="text-table-head px-4 py-2.5 w-32">Joined</th>
              <th className="text-table-head px-4 py-2.5 w-32">Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <tr
                  key={s.id}
                  className={cn(
                    "border-b last:border-b-0 border-border transition-colors",
                    isSelected ? "bg-brand-bg/60" : "hover:bg-mute-4/40"
                  )}
                >
                  <td className="pl-4 pr-2 py-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(s.id)}
                      aria-label={`Select ${s.firstName} ${s.lastName}`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/students/${s.id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <AvatarInitials
                        firstName={s.firstName}
                        lastName={s.lastName}
                        size={28}
                      />
                      <div>
                        <div className="font-semibold text-foreground group-hover:underline">
                          {s.firstName} {s.lastName}
                        </div>
                        {s.email && (
                          <div className="text-[11.5px] text-mute-1">
                            {s.email}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-mute-1 font-mono text-[12px]">
                    {s.grade ? `Gr. ${s.grade}` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(s.tracks.length > 0 ? s.tracks : [s.track]).map((t) => (
                        <span
                          key={t}
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border",
                            TRACK_BADGE[t]
                          )}
                        >
                          {TRACK_LABEL[t]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-mute-1 text-[12px]">
                    {format(new Date(s.joinedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.active ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-success font-medium">
                        <span className="size-1.5 bg-success rounded-full" />
                        Active
                      </span>
                    ) : (
                      <span className="text-mute-2 text-[12px]">Inactive</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
