"use client";

import { useState, useTransition } from "react";
import { Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitAssessment } from "@/app/trial-students/actions";
import { cn } from "@/lib/utils";

interface Props {
  trialStudentId: string;
  initial?: {
    enthusiasm?: number;
    capability?: number;
    fitNotes?: string;
    recommend?: boolean;
  };
}

export function AssessmentForm({ trialStudentId, initial }: Props) {
  const [enthusiasm, setEnthusiasm] = useState(initial?.enthusiasm ?? 3);
  const [capability, setCapability] = useState(initial?.capability ?? 3);
  const [fitNotes, setFitNotes] = useState(initial?.fitNotes ?? "");
  const [recommend, setRecommend] = useState<boolean | null>(
    initial?.recommend ?? null
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (recommend === null) {
      toast.error("Pick a recommendation");
      return;
    }
    if (!fitNotes.trim()) {
      toast.error("Fit notes required");
      return;
    }
    startTransition(async () => {
      try {
        await submitAssessment(trialStudentId, {
          enthusiasm,
          capability,
          fitNotes: fitNotes.trim(),
          recommend,
        });
        toast.success("Assessment submitted");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Rating label="Enthusiasm" value={enthusiasm} onChange={setEnthusiasm} />
      <Rating label="Capability" value={capability} onChange={setCapability} />

      <div className="space-y-1.5">
        <Label>Fit notes</Label>
        <Textarea
          rows={4}
          value={fitNotes}
          onChange={(e) => setFitNotes(e.target.value)}
          placeholder="What stood out? What track might fit best?"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Recommendation</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border text-[13px] font-semibold transition-colors",
              recommend === true
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-card border-border text-mute-1 hover:text-foreground"
            )}
          >
            <ThumbsUp size={14} /> Recommend enrol
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border text-[13px] font-semibold transition-colors",
              recommend === false
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-card border-border text-mute-1 hover:text-foreground"
            )}
          >
            <ThumbsDown size={14} /> Not a fit
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Submit assessment
        </Button>
      </div>
    </form>
  );
}

function Rating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}{" "}
        <span className="text-mute-2 font-mono text-[11px]">({value}/5)</span>
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "size-9 rounded-[var(--radius-sm)] border text-[13px] font-bold transition-colors",
              n <= value
                ? "bg-brand text-ink border-brand-dim"
                : "bg-card border-border text-mute-2 hover:text-foreground hover:border-mute-2"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
