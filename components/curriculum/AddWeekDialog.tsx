"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { format, nextSaturday } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addWeek } from "@/app/curriculum/actions";

interface Props {
  defaultDate?: Date;
}

export function AddWeekDialog({ defaultDate }: Props) {
  const [open, setOpen] = useState(false);
  const seed = defaultDate ?? nextSaturday(new Date());
  const [date, setDate] = useState(format(seed, "yyyy-MM-dd"));
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleAdd() {
    if (!date) return;
    startTransition(async () => {
      try {
        await addWeek({ saturday: date, label: label.trim() || null });
        toast.success("Saturday added");
        setOpen(false);
        setLabel("");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Add failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} /> Add Saturday
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Saturday</DialogTitle>
          <DialogDescription>
            Each row represents one Saturday in the season.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="saturday">Saturday</Label>
            <Input
              id="saturday"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Pre-Season Wk 1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleAdd} disabled={isPending || !date}>
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
