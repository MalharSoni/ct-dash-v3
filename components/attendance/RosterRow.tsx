"use client";

import { useState, useTransition } from "react";
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  Star,
  Loader2,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setAttendance,
  setPerformance,
  setAttendanceNotes,
} from "@/app/attendance/actions";
import { XFactorDialog } from "./XFactorDialog";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, StudentTrack } from "@prisma/client";

interface Props {
  sessionId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    track: StudentTrack;
  };
  attendance: AttendanceStatus | null;
  rating: number | null;
  notes: string | null;
  xFactorCount: number;
  lastStatus?: AttendanceStatus | null;
}

const LAST_STATUS_BADGE: Record<AttendanceStatus, { label: string; cls: string; tip: string }> = {
  PRESENT: { label: "P", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", tip: "Present last session" },
  LATE: { label: "L", cls: "bg-amber-50 text-amber-700 border-amber-200", tip: "Late last session" },
  EXCUSED: { label: "E", cls: "bg-blue-50 text-blue-700 border-blue-200", tip: "Excused last session" },
  ABSENT: { label: "A", cls: "bg-red-50 text-red-700 border-red-200", tip: "Absent last session" },
};

const STATUS_BUTTONS: { value: AttendanceStatus; label: string; icon: typeof Check; cls: string }[] = [
  { value: "PRESENT", label: "P", icon: Check, cls: "data-[on=true]:bg-emerald-50 data-[on=true]:text-emerald-700 data-[on=true]:border-emerald-300" },
  { value: "LATE", label: "L", icon: Clock, cls: "data-[on=true]:bg-amber-50 data-[on=true]:text-amber-700 data-[on=true]:border-amber-300" },
  { value: "EXCUSED", label: "E", icon: ShieldCheck, cls: "data-[on=true]:bg-blue-50 data-[on=true]:text-blue-700 data-[on=true]:border-blue-300" },
  { value: "ABSENT", label: "A", icon: X, cls: "data-[on=true]:bg-red-50 data-[on=true]:text-red-700 data-[on=true]:border-red-300" },
];

export function RosterRow({
  sessionId,
  student,
  attendance,
  rating,
  notes,
  xFactorCount,
  lastStatus,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [xfOpen, setXfOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(notes ?? "");

  function pickAttendance(status: AttendanceStatus) {
    startTransition(async () => {
      try {
        await setAttendance({ sessionId, studentId: student.id, status });
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function pickRating(n: number) {
    startTransition(async () => {
      try {
        await setPerformance({ sessionId, studentId: student.id, rating: n });
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
    <tr className="border-b last:border-b-0 border-border hover:bg-mute-4/40 transition-colors">
      <td className="px-4 py-2 sticky left-0 bg-card z-10 group-hover:bg-mute-4/40">
        <div className="flex items-center gap-2.5">
          <AvatarInitials firstName={student.firstName} lastName={student.lastName} size={28} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-semibold text-[13px]">
              <span>{student.firstName} {student.lastName}</span>
              {lastStatus && lastStatus !== "PRESENT" && (
                <span
                  title={LAST_STATUS_BADGE[lastStatus].tip}
                  className={cn(
                    "inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold border",
                    LAST_STATUS_BADGE[lastStatus].cls
                  )}
                >
                  {LAST_STATUS_BADGE[lastStatus].label}
                </span>
              )}
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.05em] text-mute-1 font-bold">
              {student.track === "FOUNDATION" ? "Foundation" : student.track === "PROJECTS" ? "Projects" : student.track}
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          {STATUS_BUTTONS.map((s) => {
            const Icon = s.icon;
            const on = attendance === s.value;
            return (
              <button
                key={s.value}
                type="button"
                data-on={on}
                onClick={() => pickAttendance(s.value)}
                disabled={isPending}
                className={cn(
                  "size-8 rounded-[var(--radius-sm)] border border-border text-mute-1 hover:text-foreground inline-flex items-center justify-center transition-colors",
                  s.cls
                )}
                title={s.value}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => pickRating(n)}
              disabled={isPending || !attendance || attendance === "ABSENT"}
              className={cn(
                "size-7 rounded-[4px] border border-border text-[11px] font-bold transition-colors",
                rating != null && n <= rating
                  ? "bg-brand text-ink border-brand-dim"
                  : "bg-card text-mute-2 hover:text-foreground hover:border-mute-2 disabled:opacity-50"
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          {!attendance ? (
            <span className="text-mute-2 text-[11px] font-mono">—</span>
          ) : noteOpen ? (
            <Input
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => {
                if (noteDraft !== (notes ?? "")) {
                  startTransition(async () => {
                    try {
                      await setAttendanceNotes({
                        sessionId,
                        studentId: student.id,
                        notes: noteDraft || null,
                      });
                    } catch (e: unknown) {
                      toast.error(e instanceof Error ? e.message : "Failed");
                    }
                  });
                }
                setNoteOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setNoteDraft(notes ?? "");
                  setNoteOpen(false);
                }
              }}
              placeholder="Note…"
              className="h-7 text-[11.5px]"
            />
          ) : (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className={cn(
                "h-7 px-2 rounded-[var(--radius-sm)] border border-border text-[11.5px] inline-flex items-center gap-1 transition-colors",
                notes
                  ? "bg-amber-50 text-amber-700 border-amber-200 max-w-32 truncate"
                  : "text-mute-2 hover:text-foreground"
              )}
              title={notes ?? "Add note"}
            >
              <StickyNote size={11} className="shrink-0" />
              <span className="truncate">{notes ?? "Add note"}</span>
            </button>
          )}
        </div>
      </td>
      <td className="px-2 py-2">
        <Button variant="outline" size="sm" onClick={() => setXfOpen(true)} disabled={isPending}>
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
          {xFactorCount > 0 ? `${xFactorCount}` : "Add"}
        </Button>
      </td>
    </tr>
    <XFactorDialog
      open={xfOpen}
      onOpenChange={setXfOpen}
      sessionId={sessionId}
      student={student}
    />
    </>
  );
}
