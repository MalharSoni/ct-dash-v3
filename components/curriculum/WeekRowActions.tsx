"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, CalendarOff, Calendar, Trash2, Loader2, Pencil, Copy, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { COHORT_META } from "@/lib/curriculum";
import type { CurriculumCohort } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toggleBreak, removeWeek, duplicateWeek } from "@/app/curriculum/actions";
import { WeekEditDialog } from "./WeekEditDialog";
import { format, addDays } from "date-fns";
import type { WeekDTO } from "./types";

export function WeekRowActions({
  week,
  activeCohort,
}: {
  week: WeekDTO;
  activeCohort?: CurriculumCohort;
}) {
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [breakNote, setBreakNote] = useState(week.breakNote ?? "");
  const [isPending, startTransition] = useTransition();

  // Date-picker dialog for "Copy to pick Saturday..."
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargetDate, setCopyTargetDate] = useState("");
  const [copyScopeAll, setCopyScopeAll] = useState(false);

  function handleMarkBreak() {
    if (week.isBreak) {
      // Unmark
      startTransition(async () => {
        try {
          await toggleBreak({ weekId: week.id, isBreak: false });
          toast.success("Break removed");
        } catch (e: unknown) {
          toast.error(e instanceof Error ? e.message : "Failed");
        }
      });
    } else {
      setBreakDialogOpen(true);
    }
  }

  function handleSaveBreak() {
    startTransition(async () => {
      try {
        await toggleBreak({
          weekId: week.id,
          isBreak: true,
          breakNote: breakNote.trim() || null,
        });
        toast.success("Marked as break");
        setBreakDialogOpen(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDuplicate(daysAhead: number) {
    // The displayed Saturday (UTC midnight) shifted forward by N days.
    const utc = new Date(week.saturday);
    const target = new Date(
      utc.getUTCFullYear(),
      utc.getUTCMonth(),
      utc.getUTCDate()
    );
    const next = addDays(target, daysAhead);
    const iso = format(next, "yyyy-MM-dd");
    startTransition(async () => {
      try {
        await duplicateWeek({
          sourceWeekId: week.id,
          targetSaturday: iso,
          cohort: activeCohort,
        });
        toast.success(`Copied to ${format(next, "MMM d")}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleOpenCopyDialog() {
    // Default to one week ahead
    const utc = new Date(week.saturday);
    const target = new Date(
      utc.getUTCFullYear(),
      utc.getUTCMonth(),
      utc.getUTCDate()
    );
    setCopyTargetDate(format(addDays(target, 7), "yyyy-MM-dd"));
    setCopyDialogOpen(true);
  }

  function handleConfirmCopy() {
    if (!copyTargetDate || !/^\d{4}-\d{2}-\d{2}$/.test(copyTargetDate)) {
      toast.error("Pick a valid date");
      return;
    }
    startTransition(async () => {
      try {
        await duplicateWeek({
          sourceWeekId: week.id,
          targetSaturday: copyTargetDate,
          cohort: copyScopeAll ? undefined : activeCohort,
        });
        const friendly = new Date(copyTargetDate + "T00:00:00Z").toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }
        );
        toast.success(`Copied to ${friendly}`);
        setCopyDialogOpen(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Delete this Saturday? All lessons assigned to it will also be removed."
      )
    )
      return;
    startTransition(async () => {
      try {
        await removeWeek(week.id);
        toast.success("Saturday removed");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="size-6 rounded-md grid place-items-center text-mute-1 hover:bg-mute-4 hover:text-foreground transition-colors"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MoreHorizontal size={14} />
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}>
            <Pencil size={14} /> Edit Saturday
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleDuplicate(7)}>
            <Copy size={14} /> Copy → next Saturday
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleOpenCopyDialog}>
            <CalendarRange size={14} /> Copy → pick Saturday…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleMarkBreak}>
            {week.isBreak ? (
              <>
                <Calendar size={14} /> Unmark break
              </>
            ) : (
              <>
                <CalendarOff size={14} /> Mark as break
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} /> Delete Saturday
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WeekEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        week={week}
      />

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy this Saturday</DialogTitle>
            <DialogDescription>
              Pick the Saturday to copy this week&apos;s lessons to.
              {activeCohort &&
                ` Scope: ${
                  copyScopeAll ? "all cohorts" : COHORT_META[activeCohort].label + " only"
                }.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="copy-target">Target Saturday</Label>
              <Input
                id="copy-target"
                type="date"
                value={copyTargetDate}
                onChange={(e) => setCopyTargetDate(e.target.value)}
                autoFocus
              />
            </div>
            {activeCohort && (
              <label className="flex items-center gap-2 text-[12.5px] text-mute-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyScopeAll}
                  onChange={(e) => setCopyScopeAll(e.target.checked)}
                  className="size-3.5"
                />
                Copy lessons for <strong>all cohorts</strong>, not just{" "}
                {COHORT_META[activeCohort].label}
              </label>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCopyDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmCopy} disabled={isPending}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Copy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={breakDialogOpen} onOpenChange={setBreakDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as break</DialogTitle>
            <DialogDescription>
              The whole row will display as a break with this note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="break-note">Reason (optional)</Label>
            <Input
              id="break-note"
              value={breakNote}
              onChange={(e) => setBreakNote(e.target.value)}
              placeholder="e.g. Civic Holiday"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBreakDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveBreak} disabled={isPending}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Mark break
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
