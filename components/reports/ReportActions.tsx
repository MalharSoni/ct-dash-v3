"use client";

import { useTransition } from "react";
import { Send, Trash2, Printer, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  publishReport,
  deleteReport,
} from "@/app/students/[id]/reports/actions";

interface Props {
  reportId: string;
  studentId: string;
  published: boolean;
}

export function ReportActions({ reportId, studentId, published }: Props) {
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    startTransition(async () => {
      try {
        await publishReport(reportId, studentId);
        toast.success("Report published");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    startTransition(async () => {
      try {
        await deleteReport(reportId, studentId);
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link
          href={`/students/${studentId}/reports/${reportId}/print`}
          target="_blank"
        >
          <Printer size={13} /> Print / PDF
        </Link>
      </Button>
      {!published && (
        <Button size="sm" onClick={handlePublish} disabled={isPending}>
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Send size={13} />
          )}
          Publish
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 size={13} /> Delete
      </Button>
    </div>
  );
}
