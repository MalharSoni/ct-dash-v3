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
import { renameTimeslot } from "@/app/curriculum/actions";
import type { TimeslotDTO } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  timeslot: TimeslotDTO;
}

export function TimeslotEditDialog({ open, onOpenChange, timeslot }: Props) {
  const [name, setName] = useState(timeslot.name);
  const [start, setStart] = useState(timeslot.startTime);
  const [end, setEnd] = useState(timeslot.endTime);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      try {
        await renameTimeslot({
          id: timeslot.id,
          name: name.trim(),
          startTime: start,
          endTime: end,
        });
        toast.success("Column updated");
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
          <DialogTitle>Edit column</DialogTitle>
          <DialogDescription>
            Rename or change the time range of this column.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ts-name">Column name</Label>
            <Input
              id="ts-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ts-start">Start</Label>
              <Input
                id="ts-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ts-end">End</Label>
              <Input
                id="ts-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
