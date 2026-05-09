"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteStudent } from "@/app/students/actions";

interface Props {
  studentId: string;
  studentName: string;
}

export function RemoveStudentButton({ studentId, studentName }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!confirming) {
      setConfirming(true);
      // Auto-cancel the armed state after 5s so a stray click doesn't linger.
      setTimeout(() => setConfirming(false), 5000);
      return;
    }
    startTransition(async () => {
      try {
        await deleteStudent(studentId);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Delete failed");
        setConfirming(false);
      }
    });
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
