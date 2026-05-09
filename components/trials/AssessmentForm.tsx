"use client";

import { useState, useTransition } from "react";
import {
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Sparkles,
  Wrench,
  Eye,
  Gamepad2,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitAssessment } from "@/app/trial-students/actions";
import { cn } from "@/lib/utils";

interface Props {
  trialStudentId: string;
  studentFirstName: string;
  initial?: {
    enthusiasm?: number;
    capability?: number;
    fitNotes?: string;
    recommend?: boolean;
  };
}

type Recommend = "ENROLL" | "NOT_YET" | null;

interface Chip {
  label: string;
  /** Sentence using the student's first name. Used for the first sentence. */
  asName: string;
  /** Sentence using "they/them". Used for any subsequent sentence. */
  asThey: string;
  category: "build" | "understanding" | "drive" | "attention" | "engagement";
}

// Positive observations — show when recommending Enroll.
const STRENGTH_CHIPS: Chip[] = [
  { category: "build", label: "Built drivetrain quickly",
    asName: "{N} built the drivetrain quickly.",
    asThey: "They built the drivetrain quickly." },
  { category: "build", label: "Solid mechanical fundamentals",
    asName: "{N} showed solid mechanical fundamentals.",
    asThey: "They showed solid mechanical fundamentals." },
  { category: "build", label: "Comfortable with hand tools",
    asName: "{N} was comfortable with hand tools.",
    asThey: "They were comfortable with hand tools." },

  { category: "understanding", label: "Strong grasp of VEX parts",
    asName: "{N} had a strong grasp of VEX parts.",
    asThey: "They had a strong grasp of VEX parts." },
  { category: "understanding", label: "Asked thoughtful questions",
    asName: "{N} asked thoughtful questions throughout the session.",
    asThey: "They asked thoughtful questions throughout the session." },
  { category: "understanding", label: "Connected concepts quickly",
    asName: "{N} connected concepts quickly.",
    asThey: "They connected concepts quickly." },

  { category: "drive", label: "Confident driver",
    asName: "{N} drove confidently.",
    asThey: "They drove confidently." },
  { category: "drive", label: "Picked up controls fast",
    asName: "{N} picked up the controls fast.",
    asThey: "They picked up the controls fast." },
  { category: "drive", label: "Smooth, intentional movements",
    asName: "{N} showed smooth, intentional movements.",
    asThey: "They showed smooth, intentional movements." },

  { category: "attention", label: "Iterated and improved",
    asName: "{N} iterated and improved over the session.",
    asThey: "They iterated and improved over the session." },
  { category: "attention", label: "Caught small mistakes",
    asName: "{N} caught small mistakes without prompting.",
    asThey: "They caught small mistakes without prompting." },
  { category: "attention", label: "Patient with adjustments",
    asName: "{N} was patient with adjustments.",
    asThey: "They were patient with adjustments." },

  { category: "engagement", label: "Engaged throughout",
    asName: "{N} stayed engaged throughout the trial.",
    asThey: "They stayed engaged throughout the trial." },
  { category: "engagement", label: "Worked well with peers",
    asName: "{N} worked well with peers.",
    asThey: "They worked well with peers." },
  { category: "engagement", label: "Positive attitude",
    asName: "{N} kept a positive attitude.",
    asThey: "They kept a positive attitude." },
];

// Closing chips — pick one. Adds the recommendation sentence at the end.
const CLOSE_CHIPS_ENROLL: Pick<Chip, "label" | "asName" | "asThey">[] = [
  { label: "Ready for High School Program",
    asName: "{N} is ready to start in our High School Program.",
    asThey: "They are ready to start in our High School Program." },
  { label: "Strong starter for Foundation",
    asName: "{N} will be a strong starter in our Foundation phase.",
    asThey: "They will be a strong starter in our Foundation phase." },
  { label: "Strong competition potential",
    asName: "We see strong competition potential in {N} going forward.",
    asThey: "We see strong competition potential going forward." },
];

// Concerns — show when "Not yet".
const CONCERN_CHIPS: Pick<Chip, "label" | "asName" | "asThey">[] = [
  { label: "Better fit for older cohort",
    asName: "{N} may be better suited to our older cohort.",
    asThey: "They may be better suited to our older cohort." },
  { label: "Needs foundation skills first",
    asName: "{N} will benefit from more foundational skill-building before joining.",
    asThey: "They will benefit from more foundational skill-building before joining." },
  { label: "Re-trial in a few months",
    asName: "We suggest re-trialing {N} in a few months.",
    asThey: "We suggest re-trialing in a few months." },
  { label: "Try Foundation first",
    asName: "{N} will thrive in our Foundation phase before moving on.",
    asThey: "They will thrive in our Foundation phase before moving on." },
];

const CATEGORY_META: Record<
  Chip["category"],
  { label: string; icon: typeof Wrench }
> = {
  build: { label: "Build", icon: Wrench },
  understanding: { label: "Understanding", icon: Sparkles },
  drive: { label: "Driving", icon: Gamepad2 },
  attention: { label: "Attention", icon: Eye },
  engagement: { label: "Engagement", icon: Smile },
};

const CATEGORY_ORDER: Chip["category"][] = [
  "build",
  "understanding",
  "drive",
  "attention",
  "engagement",
];

export function AssessmentForm({
  trialStudentId,
  studentFirstName,
  initial,
}: Props) {
  const [recommend, setRecommend] = useState<Recommend>(
    initial?.recommend === true
      ? "ENROLL"
      : initial?.recommend === false
      ? "NOT_YET"
      : null
  );
  const [skill, setSkill] = useState(initial?.capability ?? 3);
  const [engagement, setEngagement] = useState(initial?.enthusiasm ?? 3);
  const [paragraph, setParagraph] = useState(initial?.fitNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function appendChip(chip: { asName: string; asThey: string }) {
    setParagraph((prev) => {
      const trimmed = prev.trim();
      // First sentence names the student; subsequent sentences use "they".
      const sentence =
        trimmed.length === 0
          ? chip.asName.replace(/\{N\}/g, studentFirstName)
          : chip.asThey;
      return trimmed.length === 0 ? sentence : trimmed + " " + sentence;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!recommend) {
      toast.error("Pick a recommendation first");
      return;
    }
    if (!paragraph.trim()) {
      toast.error("Add a few notes for the parent email");
      return;
    }
    startTransition(async () => {
      try {
        await submitAssessment(trialStudentId, {
          enthusiasm: engagement,
          capability: skill,
          fitNotes: paragraph.trim(),
          recommend: recommend === "ENROLL",
        });
        toast.success("Assessment saved");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  const isEnroll = recommend === "ENROLL";
  const isNotYet = recommend === "NOT_YET";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Recommendation — drives which chips show. */}
      <div className="space-y-1.5">
        <Label>Recommendation</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRecommend("ENROLL")}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] border text-[13px] font-semibold transition-colors",
              isEnroll
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-card border-border text-mute-1 hover:text-foreground"
            )}
          >
            <ThumbsUp size={14} /> Enroll {studentFirstName}
          </button>
          <button
            type="button"
            onClick={() => setRecommend("NOT_YET")}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] border text-[13px] font-semibold transition-colors",
              isNotYet
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-card border-border text-mute-1 hover:text-foreground"
            )}
          >
            <ThumbsDown size={14} /> Not yet
          </button>
        </div>
      </div>

      {/* Ratings — defaulted to 3, fast to skip. */}
      <div className="grid grid-cols-2 gap-3">
        <Rating label="Skill" value={skill} onChange={setSkill} />
        <Rating
          label="Engagement"
          value={engagement}
          onChange={setEngagement}
        />
      </div>

      {/* Chip composer — only show after a recommendation is picked. */}
      {recommend && (
        <div className="space-y-3 rounded-[var(--radius)] bg-mute-4/40 p-3 border border-border">
          <div className="flex items-center justify-between">
            <Label className="text-section-header">
              {isEnroll ? "What stood out?" : "Why not yet?"}
            </Label>
            <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
              Tap to add — edit below
            </span>
          </div>

          {isEnroll ? (
            <div className="space-y-2">
              {CATEGORY_ORDER.map((cat) => {
                const chips = STRENGTH_CHIPS.filter((c) => c.category === cat);
                const meta = CATEGORY_META[cat];
                const Icon = meta.icon;
                return (
                  <div key={cat} className="flex items-start gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.05em] text-mute-1 mt-1.5 w-[88px] shrink-0">
                      <Icon size={11} />
                      {meta.label}
                    </span>
                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                      {chips.map((c) => (
                        <ChipButton
                          key={c.label}
                          label={c.label}
                          onClick={() => appendChip(c)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              <div className="pt-1.5 border-t border-border flex items-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.05em] text-mute-1 mt-1.5 w-[88px] shrink-0">
                  Closer
                </span>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {CLOSE_CHIPS_ENROLL.map((c) => (
                    <ChipButton
                      key={c.label}
                      label={c.label}
                      tone="primary"
                      onClick={() => appendChip(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {CONCERN_CHIPS.map((c) => (
                <ChipButton
                  key={c.label}
                  label={c.label}
                  tone="warn"
                  onClick={() => appendChip(c)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Free-text — pre-filled by chips, coach refines. */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>
            Notes for {studentFirstName}&apos;s parent
            <span className="text-mute-2 font-normal text-[11.5px] ml-1.5">
              (this becomes the email body)
            </span>
          </Label>
          {paragraph.length > 0 && (
            <button
              type="button"
              onClick={() => setParagraph("")}
              className="text-[11px] font-semibold text-mute-1 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <Textarea
          rows={5}
          value={paragraph}
          onChange={(e) => setParagraph(e.target.value)}
          placeholder={
            recommend
              ? "Tap chips above, then refine here. The parent will read this in their email."
              : "Pick a recommendation above to see chip suggestions."
          }
        />
        <p className="text-[11px] text-mute-1">
          Tip: tap your phone&apos;s mic to dictate instead of typing.
        </p>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" disabled={isPending || !recommend}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Save assessment
        </Button>
      </div>
    </form>
  );
}

function ChipButton({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "primary" | "warn";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11.5px] font-medium transition-colors",
        "active:scale-[.97]",
        tone === "primary" &&
          "bg-brand-bg border-brand-dim/40 text-ink hover:bg-brand/30",
        tone === "warn" &&
          "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
        tone === "default" &&
          "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
      )}
    >
      <Plus size={10} strokeWidth={2.6} className="opacity-70" />
      {label}
    </button>
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
              "size-9 flex-1 rounded-[var(--radius-sm)] border text-[13px] font-bold transition-colors",
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
