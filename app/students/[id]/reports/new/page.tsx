import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { format, subMonths } from "date-fns";
import { AppShell } from "@/components/layout/AppShell";
import { ReportForm } from "@/components/reports/ReportForm";
import { prisma } from "@/lib/prisma";
import { computeAttendancePct } from "../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewReportPage({ params }: PageProps) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  const today = new Date();
  const start = subMonths(today, 3);
  const computedPct = await computeAttendancePct(student.id, start, today);

  return (
    <AppShell title={`New report · ${student.firstName} ${student.lastName}`}>
      <div className="space-y-4">
        <Link
          href={`/students/${student.id}`}
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to profile
        </Link>
        <ReportForm
          studentId={student.id}
          defaultStart={format(start, "yyyy-MM-dd")}
          defaultEnd={format(today, "yyyy-MM-dd")}
          defaultAttendancePct={computedPct}
        />
      </div>
    </AppShell>
  );
}
