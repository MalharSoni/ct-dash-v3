"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  upsertStudentSkill,
  removeStudentSkill,
} from "@/app/students/[id]/skills/actions";
import { cn } from "@/lib/utils";
import type { SkillLevel } from "@prisma/client";

const LEVELS: { value: SkillLevel; label: string; cls: string }[] = [
  { value: "LEARNING", label: "Learning", cls: "bg-amber-100 text-amber-700" },
  {
    value: "PROFICIENT",
    label: "Proficient",
    cls: "bg-emerald-100 text-emerald-700",
  },
  { value: "EXPERT", label: "Expert", cls: "bg-blue-100 text-blue-700" },
];

const CATEGORIES = ["Mechanical", "Programming", "Design", "Strategy", "Notebook"];

type StudentSkill = {
  id: string;
  level: SkillLevel;
  evidence: string | null;
  skill: { id: string; name: string; category: string };
};

interface Props {
  studentId: string;
  skills: StudentSkill[];
}

export function SkillsManager({ studentId, skills }: Props) {
  const [adding, setAdding] = useState(false);
  const [skillName, setSkillName] = useState("");
  const [category, setCategory] = useState("Mechanical");
  const [level, setLevel] = useState<SkillLevel>("LEARNING");
  const [evidence, setEvidence] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!skillName.trim()) {
      toast.error("Skill name required");
      return;
    }
    startTransition(async () => {
      try {
        await upsertStudentSkill({
          studentId,
          skillName: skillName.trim(),
          category,
          level,
          evidence: evidence.trim() || null,
        });
        toast.success("Skill added");
        setSkillName("");
        setEvidence("");
        setAdding(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleLevel(skill: StudentSkill, newLevel: SkillLevel) {
    startTransition(async () => {
      try {
        await upsertStudentSkill({
          studentId,
          skillName: skill.skill.name,
          category: skill.skill.category,
          level: newLevel,
          evidence: skill.evidence,
        });
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleRemove(skillId: string) {
    if (!confirm("Remove this skill?")) return;
    startTransition(async () => {
      try {
        await removeStudentSkill({ studentId, skillId });
        toast.success("Removed");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  // Group by category
  const groups = new Map<string, StudentSkill[]>();
  for (const s of skills) {
    const arr = groups.get(s.skill.category) ?? [];
    arr.push(s);
    groups.set(s.skill.category, arr);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">
          Skills <span className="text-mute-1 font-normal">({skills.length})</span>
        </h3>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add skill
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Skill</Label>
              <Input
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. CAD modeling"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Level</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as SkillLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Evidence (optional)</Label>
            <Input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Link or note"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {skills.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">No skills logged yet.</p>
      ) : (
        <div className="space-y-3">
          {[...groups.entries()].map(([cat, items]) => (
            <div key={cat} className="space-y-1.5">
              <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                {cat}
              </div>
              <ul className="space-y-1">
                {items.map((s) => {
                  const lvl = LEVELS.find((l) => l.value === s.level);
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-card border border-border rounded-[var(--radius-sm)] group"
                    >
                      <span className="text-[13px] font-medium flex-1 truncate">
                        {s.skill.name}
                      </span>
                      <Select
                        value={s.level}
                        onValueChange={(v) => handleLevel(s, v as SkillLevel)}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 w-28 text-[11px] font-bold uppercase tracking-[0.03em]",
                            lvl?.cls
                          )}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={() => handleRemove(s.skill.id)}
                        disabled={isPending}
                        className="size-7 rounded-md text-mute-2 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
