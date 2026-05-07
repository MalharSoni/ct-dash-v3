import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { format, subMonths } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { BulkReportForm } from "@/components/reports/BulkReportForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BulkReportsPage() {
  // Counts to show preview by track
  const counts = await prisma.student.groupBy({
    by: ["track"],
    where: { active: true },
    _count: true,
  });
  const byTrack = Object.fromEntries(counts.map((c) => [c.track, c._count]));

  const today = new Date();
  const start = subMonths(today, 3);

  return (
    <AppShell title="Bulk report cards">
      <div className="space-y-4 max-w-2xl">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to students
        </Link>
        <p className="text-[13px] text-mute-1">
          Create one draft report card per active student in the selected
          tracks. Existing reports for the same period are skipped, not
          overwritten.
        </p>
        <BulkReportForm
          counts={{
            FOUNDATION: byTrack.FOUNDATION ?? 0,
            PROJECTS: byTrack.PROJECTS ?? 0,
            GRADUATED: byTrack.GRADUATED ?? 0,
            INACTIVE: byTrack.INACTIVE ?? 0,
          }}
          defaultStart={format(start, "yyyy-MM-dd")}
          defaultEnd={format(today, "yyyy-MM-dd")}
        />
      </div>
    </AppShell>
  );
}
