import { format } from "date-fns";
import { ClipboardCheck, StickyNote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

export interface XFactorEntry {
  id: string;
  note: string;
  tags: string[];
  recordedBy: { name: string };
}

export interface SessionLogEntry {
  date: string; // ISO
  status: AttendanceStatus | null;
  rating: number | null;
  note: string | null;
  xFactors: XFactorEntry[];
}

const STATUS_BADGE: Record<
  AttendanceStatus,
  { label: string; bg: string; text: string }
> = {
  PRESENT: { label: "Present", bg: "bg-emerald-50", text: "text-emerald-700" },
  LATE: { label: "Late", bg: "bg-amber-50", text: "text-amber-700" },
  EXCUSED: { label: "Excused", bg: "bg-blue-50", text: "text-blue-700" },
  ABSENT: { label: "Absent", bg: "bg-red-50", text: "text-red-700" },
};

/**
 * Per-session log: one block per session date, showing attendance status,
 * rating, the coach's session note, and any x-factor notes captured during
 * that session. Replaces the separate attendance/x-factor split so coaches
 * can read a student's "week" in one place.
 */
export function SessionLog({ entries }: { entries: SessionLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-[12.5px] text-mute-1">
        No sessions logged yet. Once attendance is taken, sessions will appear
        here grouped by date.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((e) => (
        <SessionBlock key={e.date} entry={e} />
      ))}
    </div>
  );
}

function SessionBlock({ entry }: { entry: SessionLogEntry }) {
  const date = new Date(entry.date);
  const empty =
    !entry.status &&
    entry.rating == null &&
    !entry.note &&
    entry.xFactors.length === 0;

  return (
    <div className="border border-border rounded-[var(--radius-sm)] overflow-hidden">
      {/* Header: date + status + rating */}
      <div className="flex flex-wrap items-center gap-3 bg-mute-4/60 border-b border-border px-3 py-2">
        <div className="font-bold text-[13px]">
          {format(date, "EEE, MMM d")}
          <span className="ml-1.5 text-[11px] font-medium text-mute-1">
            {format(date, "yyyy")}
          </span>
        </div>
        {entry.status && (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.04em]",
              STATUS_BADGE[entry.status].bg,
              STATUS_BADGE[entry.status].text
            )}
          >
            <ClipboardCheck size={10} />
            {STATUS_BADGE[entry.status].label}
          </span>
        )}
        {entry.rating != null && (
          <div className="flex items-center gap-1">
            <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
              Rating
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "size-2 rounded-sm",
                    n <= entry.rating! ? "bg-brand" : "bg-mute-3"
                  )}
                />
              ))}
            </div>
            <span className="text-[12px] font-bold tabular-nums">
              {entry.rating}/5
            </span>
          </div>
        )}
      </div>

      {/* Body: note + x-factor */}
      {empty ? (
        <p className="px-3 py-2 text-[11.5px] text-mute-2 italic">
          No detail captured for this session.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {entry.note && (
            <div className="px-3 py-2.5 flex items-start gap-2.5">
              <StickyNote
                size={13}
                className="mt-0.5 shrink-0 text-amber-700"
              />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.06em] font-bold text-mute-1 mb-0.5">
                  Session note
                </div>
                <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {entry.note}
                </p>
              </div>
            </div>
          )}
          {entry.xFactors.map((xf) => (
            <div
              key={xf.id}
              className="px-3 py-2.5 flex items-start gap-2.5 bg-brand-bg/40"
            >
              <Star size={13} className="mt-0.5 shrink-0 text-brand-dim" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-[0.06em] font-bold text-mute-1 mb-0.5 flex items-center gap-1.5">
                  <span>X-Factor</span>
                  <span>·</span>
                  <span className="normal-case tracking-normal text-mute-1 font-semibold">
                    {xf.recordedBy.name}
                  </span>
                </div>
                <p className="text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {xf.note}
                </p>
                {xf.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {xf.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold uppercase tracking-[0.04em] bg-card border border-brand-dim/30 text-ink px-1.5 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
