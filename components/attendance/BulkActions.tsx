"use client";

import { useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  bulkSetAttendance,
  restoreAttendance,
} from "@/app/attendance/actions";
import type { AttendanceStatus } from "@prisma/client";

interface Props {
  sessionId: string;
  studentIds: string[];
  unmarkedIds: string[];
  /** Current status per student so we can offer an undo. */
  priorStatus: Record<string, AttendanceStatus | null>;
}

export function BulkActions({
  sessionId,
  studentIds,
  unmarkedIds,
  priorStatus,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function bulk(
    status: AttendanceStatus,
    ids: string[],
    label: string,
    requireConfirm = false
  ) {
    if (ids.length === 0) {
      toast.error("Nothing to mark");
      return;
    }
    // Only confirm when the action overwrites prior state. "Mark unmarked"
    // is non-destructive — undo is enough.
    if (requireConfirm) {
      const willOverwrite = ids.filter(
        (id) => priorStatus[id] && priorStatus[id] !== status
      ).length;
      if (
        willOverwrite > 0 &&
        !confirm(
          `${willOverwrite} student${willOverwrite !== 1 ? "s have" : " has"} a different status. Overwrite?`
        )
      ) {
        return;
      }
    }

    // Snapshot prior state for these ids so we can offer Undo.
    const snapshot = ids.map((id) => ({
      studentId: id,
      status: priorStatus[id] ?? null,
    }));

    startTransition(async () => {
      try {
        await bulkSetAttendance({ sessionId, studentIds: ids, status });
        toast.success(`${ids.length} marked ${label.toLowerCase()}`, {
          duration: 5000,
          action: {
            label: "Undo",
            onClick: () => {
              startTransition(async () => {
                try {
                  await restoreAttendance({ sessionId, records: snapshot });
                  toast.success("Restored");
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : "Undo failed");
                }
              });
            },
          },
        });
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
        onClick={() => bulk("PRESENT", unmarkedIds, "Present", false)}
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
        onClick={() => bulk("PRESENT", studentIds, "Present", true)}
        disabled={isPending || studentIds.length === 0}
      >
        Mark all present
      </Button>
    </div>
  );
}
