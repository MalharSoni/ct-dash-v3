"use client";

import { useTransition } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setStudentTrack } from "@/app/students/actions";

export function GraduateButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!confirm("Graduate this student to the Projects track?")) return;
    startTransition(async () => {
      try {
        await setStudentTrack(id, "PROJECTS");
        toast.success("Graduated to Projects");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={isPending}>
      {isPending ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <ArrowUpRight size={13} />
      )}
      Graduate
    </Button>
  );
}
