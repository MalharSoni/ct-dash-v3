"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, CalendarOff, Calendar, Trash2, Loader2, Pencil, Copy } from "lucide-react";
import { toast } from "sonner";
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

export function WeekRowActions({ week }: { week: WeekDTO }) {
  const [breakDialogOpen, setBreakDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [breakNote, setBreakNote] = useState(week.breakNote ?? "");
  const [isPending, startTransition] = useTransition();

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
        await duplicateWeek({ sourceWeekId: week.id, targetSaturday: iso });
        toast.success(`Copied to ${format(next, "MMM d")}`);
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
