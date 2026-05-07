"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReport } from "@/app/students/[id]/reports/actions";
import { cn } from "@/lib/utils";

interface Props {
  studentId: string;
  defaultStart: string;
  defaultEnd: string;
  defaultAttendancePct?: number | null;
}

export function ReportForm({
  studentId,
  defaultStart,
  defaultEnd,
  defaultAttendancePct,
}: Props) {
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [attendancePct, setAttendancePct] = useState<string>(
    defaultAttendancePct != null ? String(defaultAttendancePct) : ""
  );
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [narrative, setNarrative] = useState("");
  const [goals, setGoals] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!periodStart || !periodEnd) {
      toast.error("Period dates required");
      return;
    }
    startTransition(async () => {
      try {
        await createReport({
          studentId,
          periodStart,
          periodEnd,
          attendancePct: attendancePct ? Number(attendancePct) : null,
          overallRating,
          narrative: narrative.trim() || null,
          goals: goals.trim() || null,
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Reporting period</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start *</Label>
            <Input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End *</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>
              Attendance %
              {defaultAttendancePct != null && (
                <span className="ml-1.5 text-[10.5px] font-normal text-success">
                  auto-filled
                </span>
              )}
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={attendancePct}
              onChange={(e) => setAttendancePct(e.target.value)}
              placeholder={
                defaultAttendancePct == null
                  ? "no records yet"
                  : "e.g. 92"
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>Overall rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setOverallRating(n)}
                  className={cn(
                    "size-9 rounded-[var(--radius-sm)] border text-[13px] font-bold transition-colors",
                    overallRating != null && n <= overallRating
                      ? "bg-brand text-ink border-brand-dim"
                      : "bg-card border-border text-mute-2 hover:text-foreground hover:border-mute-2"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Narrative</h3>
        <Textarea
          rows={6}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="What did this student work on, accomplish, struggle with? Tone for parents."
        />
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Goals for next period</h3>
        <Textarea
          rows={3}
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="What should they focus on next?"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Save report
        </Button>
      </div>
    </form>
  );
}
