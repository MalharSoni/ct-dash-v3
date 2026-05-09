"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Wrench,
  Sparkles,
  Eye,
  Gamepad2,
  Smile,
  Check,
  AlertTriangle,
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
    challenge?: number;
    attention?: number;
    questioning?: number;
    vexKnowledge?: number;
    problemSolving?: number;
    fitNotes?: string;
    recommend?: boolean;
  };
}

type Recommend = "ENROLL" | "NOT_YET" | null;
type Polarity = "strength" | "growth";
type Category = "build" | "understanding" | "drive" | "attention" | "engagement";

interface Chip {
  id: string;
  label: string;
  category: Category;
  polarity: Polarity;
  /** Verb phrase that follows a subject. e.g., "built the drivetrain quickly". */
  asThey: string;
  asHas: string;
}

// ─────────────── Chip library ───────────────
// Strengths and growth areas across the same five categories. Coaches pick
// any combination — tone of the paragraph follows whatever's selected.

const CHIPS: Chip[] = [
  // Build
  { id: "build-fast",        category: "build", polarity: "strength", label: "Built drivetrain quickly",
    asThey: "built the drivetrain quickly",                      asHas: "has built the drivetrain quickly" },
  { id: "build-fundamentals", category: "build", polarity: "strength", label: "Solid mechanical fundamentals",
    asThey: "showed solid mechanical fundamentals",              asHas: "has solid mechanical fundamentals" },
  { id: "build-tools",       category: "build", polarity: "strength", label: "Comfortable with hand tools",
    asThey: "looked comfortable with hand tools",                asHas: "is comfortable with hand tools" },
  { id: "build-slow",        category: "build", polarity: "growth",   label: "Slow with the build",
    asThey: "needed extra support to keep the build moving",     asHas: "is still building speed on the mechanical side" },
  { id: "build-tools-shy",   category: "build", polarity: "growth",   label: "Hesitant with tools",
    asThey: "looked unsure with the hand tools",                 asHas: "would benefit from more time with hand tools" },

  // Understanding (VEX parts, concepts)
  { id: "und-vex",           category: "understanding", polarity: "strength", label: "Strong grasp of VEX parts",
    asThey: "had a strong grasp of VEX parts",                   asHas: "has a strong grasp of VEX parts" },
  { id: "und-questions",     category: "understanding", polarity: "strength", label: "Asked thoughtful questions",
    asThey: "asked thoughtful questions throughout",             asHas: "asks thoughtful questions throughout" },
  { id: "und-connect",       category: "understanding", polarity: "strength", label: "Connected concepts quickly",
    asThey: "connected concepts quickly",                        asHas: "connects concepts quickly" },
  { id: "und-vex-new",       category: "understanding", polarity: "growth",   label: "New to VEX parts",
    asThey: "is still learning the VEX parts catalogue",         asHas: "is still learning the VEX parts catalogue" },
  { id: "und-quiet",         category: "understanding", polarity: "growth",   label: "Hesitant to ask questions",
    asThey: "tended to stay quiet when stuck instead of asking", asHas: "tends to stay quiet when stuck instead of asking" },

  // Drive
  { id: "drive-conf",        category: "drive", polarity: "strength", label: "Confident driver",
    asThey: "drove confidently",                                 asHas: "drives confidently" },
  { id: "drive-fast",        category: "drive", polarity: "strength", label: "Picked up controls fast",
    asThey: "picked up the controls quickly",                    asHas: "picked up the controls quickly" },
  { id: "drive-smooth",      category: "drive", polarity: "strength", label: "Smooth, intentional driving",
    asThey: "showed smooth, intentional movements",              asHas: "shows smooth, intentional driving" },
  { id: "drive-rough",       category: "drive", polarity: "growth",   label: "Driving still rough",
    asThey: "drove a bit roughly and ran into the field elements often", asHas: "is still smoothing out their driving" },

  // Attention to detail / iteration
  { id: "att-iterate",       category: "attention", polarity: "strength", label: "Iterated and improved",
    asThey: "iterated and improved over the session",            asHas: "iterates and improves quickly" },
  { id: "att-catch",         category: "attention", polarity: "strength", label: "Catches small mistakes",
    asThey: "caught small mistakes without prompting",           asHas: "catches small mistakes without prompting" },
  { id: "att-patient",       category: "attention", polarity: "strength", label: "Patient with adjustments",
    asThey: "stayed patient with adjustments",                   asHas: "stays patient with fine adjustments" },
  { id: "att-rushed",        category: "attention", polarity: "growth",   label: "Rushes through steps",
    asThey: "rushed through steps quickly",                      asHas: "still rushes through steps at times" },
  { id: "att-overlook",      category: "attention", polarity: "growth",   label: "Misses small details",
    asThey: "overlooked small details a few times",              asHas: "is still building attention to fine details" },

  // Engagement
  { id: "eng-engaged",       category: "engagement", polarity: "strength", label: "Engaged throughout",
    asThey: "stayed engaged throughout the trial",               asHas: "stays engaged throughout the session" },
  { id: "eng-peers",         category: "engagement", polarity: "strength", label: "Worked well with peers",
    asThey: "worked well with the other students",               asHas: "works well with peers" },
  { id: "eng-positive",      category: "engagement", polarity: "strength", label: "Positive attitude",
    asThey: "kept a positive attitude",                          asHas: "keeps a positive attitude" },
  { id: "eng-distracted",    category: "engagement", polarity: "growth",   label: "Got distracted",
    asThey: "got distracted during longer builds",               asHas: "is working on staying focused during longer builds" },
  { id: "eng-shy",           category: "engagement", polarity: "growth",   label: "Quiet around peers",
    asThey: "was a bit quiet around the other students",         asHas: "is still warming up to working with peers" },
];

// Closer chips set the recommendation framing at the end of the paragraph.
const CLOSE_ENROLL: { id: string; label: string; sentence: (n: string) => string }[] = [
  { id: "close-hs",
    label: "Ready for High School Program",
    sentence: (n) => `Overall, ${n} is ready to start in our High School Program.` },
  { id: "close-foundation",
    label: "Strong starter for Foundation",
    sentence: (n) => `Overall, ${n} will be a strong starter in our Foundation phase.` },
  { id: "close-comp",
    label: "Strong competition potential",
    sentence: (n) => `Overall, we see strong competition potential in ${n} going forward.` },
];

const CLOSE_NOT_YET: { id: string; label: string; sentence: (n: string) => string }[] = [
  { id: "close-older",
    label: "Better fit for older cohort",
    sentence: (n) => `Given where ${n} is right now, our older cohort would be a better fit.` },
  { id: "close-foundation-first",
    label: "Foundation first",
    sentence: (n) => `We think ${n} would do best in our Foundation phase before moving on.` },
  { id: "close-retrial",
    label: "Re-trial in a few months",
    sentence: (n) => `We'd suggest re-trialing ${n} in a few months once they've had a bit more practice.` },
  { id: "close-skills-first",
    label: "Build basics first",
    sentence: (n) => `We'd love to see ${n} build the basics elsewhere first and come back to us.` },
];

const CATEGORY_META: Record<Category, { label: string; icon: typeof Wrench }> = {
  build: { label: "Build", icon: Wrench },
  understanding: { label: "Understanding", icon: Sparkles },
  drive: { label: "Driving", icon: Gamepad2 },
  attention: { label: "Attention", icon: Eye },
  engagement: { label: "Engagement", icon: Smile },
};

const CATEGORY_ORDER: Category[] = [
  "build",
  "understanding",
  "drive",
  "attention",
  "engagement",
];

// ─────────────── Paragraph composer ───────────────
// Stitches selected chips into prose. Group strengths into one or two
// sentences, then pivot to growth areas with "That said, …".

function composeParagraph(
  selected: Chip[],
  closer: string,
  firstName: string
): string {
  if (selected.length === 0 && !closer) return "";

  const strengths = selected.filter((c) => c.polarity === "strength");
  const growth = selected.filter((c) => c.polarity === "growth");

  const sentences: string[] = [];

  if (strengths.length > 0) {
    sentences.push(...strengthSentences(strengths, firstName));
  }

  if (growth.length > 0) {
    sentences.push(...growthSentences(growth, firstName, strengths.length > 0));
  }

  if (closer) sentences.push(closer);

  return sentences.join(" ");
}

/** Group strengths into chunks of 1–2 clauses per sentence. */
function strengthSentences(chips: Chip[], firstName: string): string[] {
  const out: string[] = [];
  const ordered = orderByCategory(chips);
  let isFirst = true;
  for (let i = 0; i < ordered.length; i += 2) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const subject = isFirst ? firstName : "They";
    isFirst = false;

    if (b) {
      out.push(`${subject} ${a.asThey} and ${b.asThey}.`);
    } else {
      out.push(`${subject} ${a.asThey}.`);
    }
  }
  return out;
}

/**
 * Growth chunks. Lead with "That said," or "On the growth side," so the
 * email reads honestly without feeling abrupt — and never lead with the
 * student's name, since growth-only emails should still respect the "name
 * goes first" rule from the strengths section.
 */
function growthSentences(
  chips: Chip[],
  firstName: string,
  hadStrengths: boolean
): string[] {
  const out: string[] = [];
  const ordered = orderByCategory(chips);
  let isFirst = true;
  for (let i = 0; i < ordered.length; i += 2) {
    const a = ordered[i];
    const b = ordered[i + 1];

    let lead: string;
    if (isFirst) {
      lead = hadStrengths
        ? "That said, " + (i === 0 ? "they" : firstName)
        : `${firstName}`;
      isFirst = false;
    } else {
      lead = "They also";
    }

    if (b) {
      out.push(`${lead} ${a.asThey} and ${b.asThey}.`);
    } else {
      out.push(`${lead} ${a.asThey}.`);
    }
  }
  return out;
}

function orderByCategory(chips: Chip[]): Chip[] {
  return [...chips].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );
}

// ─────────────── Component ───────────────

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
  const [challenge, setChallenge] = useState(initial?.challenge ?? 3);
  const [attention, setAttention] = useState(initial?.attention ?? 3);
  const [questioning, setQuestioning] = useState(initial?.questioning ?? 3);
  const [vexKnowledge, setVexKnowledge] = useState(initial?.vexKnowledge ?? 3);
  const [problemSolving, setProblemSolving] = useState(
    initial?.problemSolving ?? 3
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [closerId, setCloserId] = useState<string | null>(null);
  const [paragraph, setParagraph] = useState(initial?.fitNotes ?? "");
  // Once the coach types into the textarea, we stop overwriting it from chips.
  // They can press "Reset to chips" to re-link.
  const [manualEdit, setManualEdit] = useState(Boolean(initial?.fitNotes));
  const composedRef = useRef<string>("");

  const [isPending, startTransition] = useTransition();

  // Recompute composed paragraph from selection, but only sync into the
  // textarea when we're not in manual-edit mode.
  const composed = useMemo(() => {
    const chips = CHIPS.filter((c) => selected.has(c.id));
    const closer = closerId
      ? recommend === "ENROLL"
        ? CLOSE_ENROLL.find((c) => c.id === closerId)?.sentence(studentFirstName) ?? ""
        : CLOSE_NOT_YET.find((c) => c.id === closerId)?.sentence(studentFirstName) ?? ""
      : "";
    return composeParagraph(chips, closer, studentFirstName);
  }, [selected, closerId, recommend, studentFirstName]);

  useEffect(() => {
    composedRef.current = composed;
    if (!manualEdit) setParagraph(composed);
  }, [composed, manualEdit]);

  function toggleChip(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // If the user was hand-editing but the textarea matches the previous
    // composed output, drop manual mode so the chip flip takes effect.
    if (manualEdit && paragraph.trim() === composedRef.current.trim()) {
      setManualEdit(false);
    }
  }

  function pickCloser(id: string) {
    setCloserId((prev) => (prev === id ? null : id));
    if (manualEdit && paragraph.trim() === composedRef.current.trim()) {
      setManualEdit(false);
    }
  }

  function resetParagraph() {
    setManualEdit(false);
    setParagraph(composedRef.current);
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
          challenge,
          attention,
          questioning,
          vexKnowledge,
          problemSolving,
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
  const closerOptions = isEnroll ? CLOSE_ENROLL : CLOSE_NOT_YET;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Recommendation */}
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

      {/* Ratings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-section-header">Coach ratings</Label>
          <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
            1 = low · 5 = high
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Rating label="Skill" value={skill} onChange={setSkill} />
          <Rating
            label="Engagement"
            value={engagement}
            onChange={setEngagement}
          />
          <Rating
            label="Challenge difficulty"
            value={challenge}
            onChange={setChallenge}
          />
          <Rating
            label="Attention to detail"
            value={attention}
            onChange={setAttention}
          />
          <Rating
            label="Asks good questions"
            value={questioning}
            onChange={setQuestioning}
          />
          <Rating
            label="VEX parts knowledge"
            value={vexKnowledge}
            onChange={setVexKnowledge}
          />
          <Rating
            label="Problem solving"
            value={problemSolving}
            onChange={setProblemSolving}
          />
        </div>
      </div>

      {/* Chip composer — only after a recommendation is picked. */}
      {recommend && (
        <div className="space-y-4 rounded-[var(--radius)] bg-mute-4/40 p-3 border border-border">
          <div className="flex items-center justify-between">
            <Label className="text-section-header inline-flex items-center gap-1.5">
              <Check size={12} /> What stood out
            </Label>
            <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
              Click to toggle · click again to remove
            </span>
          </div>

          {/* Strengths grouped by category */}
          <div className="space-y-2">
            {CATEGORY_ORDER.map((cat) => {
              const chips = CHIPS.filter(
                (c) => c.category === cat && c.polarity === "strength"
              );
              return (
                <CategoryRow
                  key={`s-${cat}`}
                  category={cat}
                  chips={chips}
                  selected={selected}
                  onToggle={toggleChip}
                />
              );
            })}
          </div>

          {/* Growth */}
          <div className="pt-3 border-t border-border space-y-2">
            <Label className="text-section-header inline-flex items-center gap-1.5 text-amber-700">
              <AlertTriangle size={12} /> Where to grow
            </Label>
            <p className="text-[11.5px] text-mute-1 -mt-1">
              Honest observations are useful in the parent email. Pick any that
              fit.
            </p>
            {CATEGORY_ORDER.map((cat) => {
              const chips = CHIPS.filter(
                (c) => c.category === cat && c.polarity === "growth"
              );
              if (chips.length === 0) return null;
              return (
                <CategoryRow
                  key={`g-${cat}`}
                  category={cat}
                  chips={chips}
                  selected={selected}
                  onToggle={toggleChip}
                  tone="warn"
                />
              );
            })}
          </div>

          {/* Closer */}
          <div className="pt-3 border-t border-border space-y-2">
            <Label className="text-section-header">Closing line</Label>
            <div className="flex flex-wrap gap-1.5">
              {closerOptions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pickCloser(c.id)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11.5px] font-medium transition-colors",
                    closerId === c.id
                      ? "bg-brand-bg border-brand text-foreground"
                      : "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Free-text */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>
            Notes for {studentFirstName}&apos;s parent
            <span className="text-mute-2 font-normal text-[11.5px] ml-1.5">
              (this becomes the email body)
            </span>
          </Label>
          <div className="flex items-center gap-3">
            {manualEdit && (
              <span className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.05em] font-bold text-amber-700">
                Manual edit
              </span>
            )}
            {(paragraph.length > 0 || selected.size > 0) && (
              <button
                type="button"
                onClick={resetParagraph}
                className="text-[11px] font-semibold text-mute-1 hover:text-foreground"
              >
                Reset to chips
              </button>
            )}
          </div>
        </div>
        <Textarea
          rows={6}
          value={paragraph}
          onChange={(e) => {
            setParagraph(e.target.value);
            setManualEdit(true);
          }}
          placeholder={
            recommend
              ? "Pick chips above to auto-compose, then refine here. The parent will read this in their email."
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

function CategoryRow({
  category,
  chips,
  selected,
  onToggle,
  tone = "default",
}: {
  category: Category;
  chips: Chip[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  tone?: "default" | "warn";
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.05em] text-mute-1 mt-1.5 w-[88px] shrink-0">
        <Icon size={11} />
        {meta.label}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
        {chips.map((c) => (
          <ChipButton
            key={c.id}
            label={c.label}
            active={selected.has(c.id)}
            tone={tone}
            onClick={() => onToggle(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ChipButton({
  label,
  active,
  onClick,
  tone = "default",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "default" | "warn";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11.5px] font-medium transition-colors active:scale-[.97]",
        tone === "warn"
          ? active
            ? "bg-amber-100 border-amber-300 text-amber-900"
            : "bg-card border-border text-mute-1 hover:text-foreground hover:border-amber-200"
          : active
            ? "bg-brand-bg border-brand text-foreground"
            : "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
      )}
    >
      {active ? (
        <Check size={10} strokeWidth={2.6} />
      ) : (
        <span className="opacity-60">+</span>
      )}
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
