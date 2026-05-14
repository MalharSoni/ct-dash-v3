"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Trash2, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertEntry, removeEntry } from "@/app/curriculum/actions";
import {
  PHASES,
  PHASE_META,
  COHORTS,
  COHORT_META,
  DEFAULT_COHORT,
  LESSON_TRACKS,
  LESSON_TRACK_META,
} from "@/lib/curriculum";
import type { EntryDTO, TimeslotDTO, WeekDTO } from "./types";
import type {
  CurriculumPhase,
  CurriculumCohort,
  LessonTrack,
} from "@prisma/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  week: WeekDTO;
  timeslot: TimeslotDTO;
  entry: EntryDTO | null;
  defaultCohort?: CurriculumCohort;
}

export function EntryDialog({
  open,
  onOpenChange,
  week,
  timeslot,
  entry,
  defaultCohort = DEFAULT_COHORT,
}: Props) {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [phase, setPhase] = useState<CurriculumPhase>(entry?.phase ?? "HANDS_ON");
  const [cohort, setCohort] = useState<CurriculumCohort>(entry?.cohort ?? defaultCohort);
  const [lessonTrack, setLessonTrack] = useState<LessonTrack | null>(
    entry?.lessonTrack ?? null
  );
  const [isPending, startTransition] = useTransition();

  // Reset state when entry/timeslot changes
  function reset() {
    setTitle(entry?.title ?? "");
    setDescription(entry?.description ?? "");
    setPhase(entry?.phase ?? "HANDS_ON");
    setCohort(entry?.cohort ?? defaultCohort);
    setLessonTrack(entry?.lessonTrack ?? null);
  }

  function handleOpenChange(v: boolean) {
    if (v) reset();
    onOpenChange(v);
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    startTransition(async () => {
      try {
        await upsertEntry({
          id: entry?.id,
          weekId: week.id,
          timeslotId: timeslot.id,
          title: title.trim(),
          description: description.trim() || null,
          phase,
          cohort,
          lessonTrack: phase === "GUIDED_LESSON" ? lessonTrack : null,
        });
        toast.success(entry ? "Updated" : "Added");
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete() {
    if (!entry) return;
    startTransition(async () => {
      try {
        await removeEntry(entry.id);
        toast.success("Removed");
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  const utc = new Date(week.saturday);
  const local = new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate()
  );
  const dateLabel = format(local, "EEE, MMM d");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Edit lesson" : "Add lesson"}</DialogTitle>
          <DialogDescription>
            {dateLabel} · {timeslot.name} ({timeslot.startTime}–{timeslot.endTime})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Engineering Notebook"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cohort">Cohort</Label>
              <Select value={cohort} onValueChange={(v) => setCohort(v as CurriculumCohort)}>
                <SelectTrigger id="cohort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COHORTS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {COHORT_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phase">Phase</Label>
              <Select value={phase} onValueChange={(v) => setPhase(v as CurriculumPhase)}>
                <SelectTrigger id="phase">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHASES.map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-sm"
                          style={{ background: PHASE_META[p].ink }}
                        />
                        {PHASE_META[p].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {phase === "GUIDED_LESSON" && (
            <div className="space-y-1.5">
              <Label htmlFor="lessonTrack">Lesson track</Label>
              <Select
                value={lessonTrack ?? "NONE"}
                onValueChange={(v) =>
                  setLessonTrack(v === "NONE" ? null : (v as LessonTrack))
                }
              >
                <SelectTrigger id="lessonTrack">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">
                    <span className="text-mute-1">Generic guided lesson</span>
                  </SelectItem>
                  {LESSON_TRACKS.map((tr) => (
                    <SelectItem key={tr} value={tr}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-sm"
                          style={{ background: LESSON_TRACK_META[tr].ink }}
                        />
                        {LESSON_TRACK_META[tr].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes shown in the parent-facing view"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {entry ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 size={14} /> Remove
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
              {entry ? "Save" : "Add"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
