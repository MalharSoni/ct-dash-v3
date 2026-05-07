"use client";

import { useTransition } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { setTrialStatus, deleteTrial } from "@/app/trial-students/actions";
import type { TrialStatus } from "@prisma/client";

const STATUSES: { value: TrialStatus; label: string }[] = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "ATTENDED", label: "Attended" },
  { value: "NO_SHOW", label: "No-show" },
  { value: "CONVERTED", label: "Joined as student" },
  { value: "DECLINED", label: "Declined" },
];

export function TrialStatusMenu({
  id,
  current,
}: {
  id: string;
  current: TrialStatus;
}) {
  const [isPending, startTransition] = useTransition();

  function setStatus(s: TrialStatus) {
    startTransition(async () => {
      try {
        await setTrialStatus(id, s);
        toast.success(`Marked ${s.toLowerCase().replace("_", " ")}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this trial?")) return;
    startTransition(async () => {
      try {
        await deleteTrial(id);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          {isPending ? <Loader2 size={13} className="animate-spin" /> : null}
          Status <ChevronDown size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onSelect={() => setStatus(s.value)}
            disabled={s.value === current}
          >
            {s.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onSelect={handleDelete}
          className="text-destructive focus:text-destructive border-t mt-1 pt-1"
        >
          Delete trial
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
