"use client";

import { useState, useTransition } from "react";
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
import { upsertMonthTheme, removeMonthTheme } from "@/app/curriculum/actions";
import { COHORT_META } from "@/lib/curriculum";
import type { MonthThemeDTO } from "./types";
import type { CurriculumCohort } from "@prisma/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  yearMonth: string;       // "YYYY-MM"
  cohort: CurriculumCohort;
  existing: MonthThemeDTO | null;
}

function formatYearMonth(ym: string) {
  // ym is "YYYY-MM" — render as e.g. "May 2026"
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function MonthThemeDialog({
  open,
  onOpenChange,
  yearMonth,
  cohort,
  existing,
}: Props) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? "");
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle(existing?.title ?? "");
    setSubtitle(existing?.subtitle ?? "");
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
        await upsertMonthTheme({
          yearMonth,
          cohort,
          title: title.trim(),
          subtitle: subtitle.trim() || null,
        });
        toast.success(existing ? "Updated" : "Added");
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  async function handleDelete() {
    if (!existing) return;
    startTransition(async () => {
      try {
        await removeMonthTheme({ yearMonth, cohort });
        toast.success("Removed");
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit month theme" : "Add month theme"}
          </DialogTitle>
          <DialogDescription>
            {formatYearMonth(yearMonth)} · {COHORT_META[cohort].label}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="month-title">Title</Label>
            <Input
              id="month-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pre-Season"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="month-subtitle">Subtitle (optional)</Label>
            <Input
              id="month-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Building Fundamentals"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {existing ? (
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
              {existing ? "Save" : "Add"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
