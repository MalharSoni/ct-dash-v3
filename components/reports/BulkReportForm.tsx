"use client";

import { useState, useTransition } from "react";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bulkCreateReports } from "@/app/students/reports/bulk/actions";
import { cn } from "@/lib/utils";

const TRACKS: { value: "FOUNDATION" | "PROJECTS" | "GRADUATED" | "INACTIVE"; label: string }[] = [
  { value: "FOUNDATION", label: "Foundation" },
  { value: "PROJECTS", label: "Projects" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "INACTIVE", label: "Inactive" },
];

interface Props {
  counts: { FOUNDATION: number; PROJECTS: number; GRADUATED: number; INACTIVE: number };
  defaultStart: string;
  defaultEnd: string;
}

export function BulkReportForm({ counts, defaultStart, defaultEnd }: Props) {
  const [tracks, setTracks] = useState<Set<string>>(new Set(["PROJECTS", "FOUNDATION"]));
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [autoAttendance, setAutoAttendance] = useState(true);
  const [narrative, setNarrative] = useState("");
  const [goals, setGoals] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    total: number;
  } | null>(null);

  const totalSelected = [...tracks].reduce(
    (acc, t) => acc + (counts[t as keyof typeof counts] ?? 0),
    0
  );

  function toggle(t: string) {
    const next = new Set(tracks);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setTracks(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tracks.size === 0) {
      toast.error("Pick at least one track");
      return;
    }
    if (!periodStart || !periodEnd) {
      toast.error("Period dates required");
      return;
    }
    startTransition(async () => {
      try {
        const r = await bulkCreateReports({
          tracks: [...tracks],
          periodStart,
          periodEnd,
          autoAttendance,
          narrative: narrative.trim() || null,
          goals: goals.trim() || null,
        });
        setResult(r);
        toast.success(
          `Created ${r.created} report${r.created !== 1 ? "s" : ""}` +
            (r.skipped > 0 ? `, ${r.skipped} skipped (already exist)` : "")
        );
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Cohort</h3>
        <p className="text-[12.5px] text-mute-1">
          Pick which tracks to generate reports for. {totalSelected} active
          student{totalSelected !== 1 ? "s" : ""} selected.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TRACKS.map((t) => {
            const on = tracks.has(t.value);
            const count = counts[t.value as keyof typeof counts] ?? 0;
            return (
              <button
                type="button"
                key={t.value}
                onClick={() => toggle(t.value)}
                className={cn(
                  "px-3 py-2 rounded-[var(--radius-sm)] border text-left transition-colors",
                  on
                    ? "bg-brand-bg border-brand-dim/40 text-ink"
                    : "bg-card border-border text-mute-1 hover:text-foreground"
                )}
              >
                <div className="text-[12.5px] font-bold">{t.label}</div>
                <div className="text-[11px] text-mute-1 font-mono">
                  {count} student{count !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Period</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Start *</Label>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End *</Label>
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-[12.5px]">
          <input
            type="checkbox"
            checked={autoAttendance}
            onChange={(e) => setAutoAttendance(e.target.checked)}
          />
          Auto-fill attendance % from real records
        </label>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Optional shared text</h3>
        <p className="text-[12px] text-mute-1">
          Leave blank to create empty drafts. You can edit each report
          individually after.
        </p>
        <div className="space-y-1.5">
          <Label>Narrative (default for all)</Label>
          <Textarea
            rows={3}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Goals (default for all)</Label>
          <Textarea
            rows={2}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
          />
        </div>
      </div>

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[var(--radius-sm)] p-3 text-[13px]">
          <div className="font-semibold text-emerald-700">
            Created {result.created} draft report{result.created !== 1 ? "s" : ""}
          </div>
          {result.skipped > 0 && (
            <div className="text-[12px] text-emerald-600 mt-0.5">
              Skipped {result.skipped} student{result.skipped !== 1 ? "s" : ""} —
              they already had a report for this exact period.
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={isPending || tracks.size === 0}>
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <FileText size={13} />
          )}
          Generate {totalSelected} draft{totalSelected !== 1 ? "s" : ""}
        </Button>
      </div>
    </form>
  );
}
