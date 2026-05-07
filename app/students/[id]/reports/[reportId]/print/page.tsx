import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { PrintTrigger } from "@/components/reports/PrintTrigger";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; reportId: string }>;
}

export const metadata = {
  title: "Report card",
};

export default async function PrintReportPage({ params }: PageProps) {
  const { id, reportId } = await params;
  const report = await prisma.reportCard.findUnique({
    where: { id: reportId },
    include: { student: true },
  });
  if (!report || report.studentId !== id) notFound();

  return (
    <div className="bg-white text-ink min-h-dvh">
      {/* Print-only — strip nav + body styles via simple page */}
      <PrintTrigger />

      <div className="max-w-[800px] mx-auto px-10 py-12 print:px-6 print:py-6">
        <div className="flex items-start justify-between border-b-2 border-ink pb-4 mb-6">
          <div>
            <Image
              src="/logos/ctrc-mark-yellow.png"
              alt="CTRC"
              width={463}
              height={427}
              className="h-12 w-auto"
            />
            <div className="mt-3 text-[11px] uppercase tracking-[0.1em] font-bold text-mute-1">
              Caution Tape Robotics
            </div>
            <h1 className="text-[24px] font-black tracking-tight">
              Student Report Card
            </h1>
          </div>
          <div className="text-right text-[11px] text-mute-1 font-mono">
            <div>
              Issued{" "}
              {report.publishedAt
                ? format(report.publishedAt, "MMM d, yyyy")
                : "—"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-mute-1">
              Student
            </div>
            <div className="text-[18px] font-extrabold mt-0.5">
              {report.student.firstName} {report.student.lastName}
            </div>
            {report.student.grade && (
              <div className="text-[12px] text-mute-1">
                Grade {report.student.grade}
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-mute-1">
              Reporting period
            </div>
            <div className="text-[14px] font-semibold mt-0.5">
              {format(report.periodStart, "MMMM d, yyyy")}
              <span className="text-mute-1"> → </span>
              {format(report.periodEnd, "MMMM d, yyyy")}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Box label="Attendance">
            {report.attendancePct != null ? `${report.attendancePct}%` : "—"}
          </Box>
          <Box label="Overall rating">
            {report.overallRating ? (
              <span className="inline-flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={cn(
                      i < report.overallRating!
                        ? "fill-brand stroke-ink"
                        : "stroke-mute-3"
                    )}
                  />
                ))}
              </span>
            ) : (
              "—"
            )}
          </Box>
        </div>

        {report.narrative && (
          <Section label="Coach's narrative">
            <p className="whitespace-pre-wrap">{report.narrative}</p>
          </Section>
        )}

        {report.goals && (
          <Section label="Goals for next period">
            <p className="whitespace-pre-wrap">{report.goals}</p>
          </Section>
        )}

        <div className="mt-10 pt-4 border-t border-mute-3 text-[10.5px] text-mute-1 font-mono">
          Caution Tape Robotics · Coach&apos;s assessment, not an academic grade.
        </div>
      </div>

      <style>{`
        @page { margin: 16mm; }
        @media print {
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}

function Box({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-mute-3 rounded-md p-3">
      <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-mute-1">
        {label}
      </div>
      <div className="text-[20px] font-extrabold mt-0.5">{children}</div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.1em] font-bold text-mute-1 mb-1.5">
        {label}
      </div>
      <div className="text-[14px] leading-relaxed">{children}</div>
    </div>
  );
}
