"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
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
import { updateWeek } from "@/app/curriculum/actions";
import type { WeekDTO } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  week: WeekDTO;
}

function toDateInput(iso: string) {
  const d = new Date(iso);
  // Display the UTC calendar day so the field shows the same Saturday
  // the matrix shows.
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function WeekEditDialog({ open, onOpenChange, week }: Props) {
  const [date, setDate] = useState(toDateInput(week.saturday));
  const [label, setLabel] = useState(week.label ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!date) return;
    startTransition(async () => {
      try {
        await updateWeek({ id: week.id, saturday: date, label: label.trim() || null });
        toast.success("Saturday updated");
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Saturday</DialogTitle>
          <DialogDescription>
            Change the date or label for this row.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="row-date">Date</Label>
            <Input
              id="row-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="row-label">Label (optional)</Label>
            <Input
              id="row-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Pre-Season Wk 1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending || !date}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
