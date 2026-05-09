"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteStudent } from "@/app/students/actions";

interface Props {
  studentId: string;
  studentName: string;
  /** Icon-only variant for table rows. Two-click confirmation still applies. */
  compact?: boolean;
}

export function RemoveStudentButton({ studentId, studentName, compact = false }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    // In the compact (row) variant, prevent any parent <Link> from navigating.
    if (compact) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!confirming) {
      setConfirming(true);
      if (compact) toast(`Click again to remove ${studentName}`);
      // Auto-cancel the armed state after 5s so a stray click doesn't linger.
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    startTransition(async () => {
      try {
        await deleteStudent(studentId);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
        toast.error(err instanceof Error ? err.message : "Delete failed");
        setConfirming(false);
      }
    });
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClick}
        disabled={isPending}
        aria-label={confirming ? `Confirm remove ${studentName}` : `Remove ${studentName}`}
        title={confirming ? "Click again to remove" : "Remove student"}
        className={cn(
          "size-8 text-mute-1 hover:text-destructive hover:bg-destructive/10",
          confirming && "text-destructive bg-destructive/10"
        )}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Trash2 size={14} />
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={onClick}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
      {confirming ? `Click again to delete ${studentName}` : "Remove student"}
    </Button>
  );
}
