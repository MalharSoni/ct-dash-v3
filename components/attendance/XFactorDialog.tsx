"use client";

import { useState, useTransition } from "react";
import { Loader2, X, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addXFactorNote } from "@/app/attendance/actions";

const SUGGESTED_TAGS = [
  "leadership",
  "creativity",
  "perseverance",
  "teamwork",
  "focus",
  "kindness",
  "innovation",
  "communication",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionId: string;
  student: { id: string; firstName: string; lastName: string };
}

export function XFactorDialog({ open, onOpenChange, sessionId, student }: Props) {
  const [note, setNote] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setNote("");
    setTagDraft("");
    setTags([]);
  }

  function addTag(t: string) {
    const clean = t.trim().toLowerCase();
    if (!clean) return;
    if (tags.includes(clean)) return;
    setTags([...tags, clean]);
    setTagDraft("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  function handleSave() {
    if (!note.trim()) {
      toast.error("Note required");
      return;
    }
    startTransition(async () => {
      try {
        await addXFactorNote({
          sessionId,
          studentId: student.id,
          note: note.trim(),
          tags,
        });
        toast.success("X-Factor logged");
        reset();
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star size={16} className="text-brand-dim" />
            X-Factor note
          </DialogTitle>
          <DialogDescription>
            For {student.firstName} {student.lastName}. Capture something
            specific worth remembering.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="xf-note">What happened?</Label>
            <Textarea
              id="xf-note"
              autoFocus
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Stepped up to debug the autonomous code when nobody else could find the issue."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagDraft);
                  }
                }}
                placeholder="Add tag, press enter"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTag(tagDraft)}
              >
                Add
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-bg border border-brand-dim/30 rounded-full text-[11px] font-semibold text-ink"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-mute-1 hover:text-destructive"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10.5px] text-mute-2 mr-1 mt-0.5">
                Suggested:
              </span>
              {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag(t)}
                  className="text-[10.5px] text-mute-1 hover:text-foreground bg-mute-4/40 hover:bg-mute-3 border border-border rounded-full px-1.5 py-0.5 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
