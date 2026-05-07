"use client";

import { useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { bulkSetAttendance } from "@/app/attendance/actions";
import type { AttendanceStatus } from "@prisma/client";

interface Props {
  sessionId: string;
  studentIds: string[];
  unmarkedIds: string[];
}

export function BulkActions({ sessionId, studentIds, unmarkedIds }: Props) {
  const [isPending, startTransition] = useTransition();

  function bulk(status: AttendanceStatus, ids: string[], label: string) {
    if (ids.length === 0) {
      toast.error(`Nothing to mark`);
      return;
    }
    if (
      !confirm(
        `Mark ${ids.length} student${ids.length !== 1 ? "s" : ""} as ${label}?`
      )
    )
      return;
    startTransition(async () => {
      try {
        await bulkSetAttendance({ sessionId, studentIds: ids, status });
        toast.success(`${ids.length} marked ${label.toLowerCase()}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => bulk("PRESENT", unmarkedIds, "Present")}
        disabled={isPending || unmarkedIds.length === 0}
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Check size={13} />
        )}
        Mark unmarked present ({unmarkedIds.length})
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => bulk("PRESENT", studentIds, "Present")}
        disabled={isPending || studentIds.length === 0}
      >
        Mark all present
      </Button>
    </div>
  );
}
