"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertTrialToStudent } from "@/app/trial-students/actions";
import type { StudentTrack } from "@prisma/client";

interface Props {
  trialId: string;
  trialName: string;
  alreadyConverted: boolean;
}

export function ConvertButton({ trialId, trialName, alreadyConverted }: Props) {
  const [open, setOpen] = useState(false);
  const [track, setTrack] = useState<StudentTrack>("FOUNDATION");
  const [isPending, startTransition] = useTransition();

  function handleConvert() {
    startTransition(async () => {
      try {
        await convertTrialToStudent({ trialId, track });
        toast.success(`${trialName} added as student`);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  if (alreadyConverted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <ArrowRight size={13} /> Already converted
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ArrowRight size={13} /> Convert to student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert {trialName} to a student</DialogTitle>
          <DialogDescription>
            Creates a new student record from this trial&apos;s details and
            marks the trial as <strong>Joined</strong>. Choose which track to
            place them on.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Track</Label>
          <Select value={track} onValueChange={(v) => setTrack(v as StudentTrack)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FOUNDATION">Foundation</SelectItem>
              <SelectItem value="PROJECTS">Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConvert} disabled={isPending}>
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
