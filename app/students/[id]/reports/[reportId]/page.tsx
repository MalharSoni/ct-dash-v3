import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, Star } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ReportActions } from "@/components/reports/ReportActions";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; reportId: string }>;
}

export default async function ReportPage({ params }: PageProps) {
  const { id, reportId } = await params;
  const report = await prisma.reportCard.findUnique({
    where: { id: reportId },
    include: { student: true },
  });
  if (!report || report.studentId !== id) notFound();

  return (
    <AppShell
      title="Report card"
      actions={
        <ReportActions
          reportId={report.id}
          studentId={id}
          published={!!report.publishedAt}
        />
      }
    >
      <div className="space-y-4 max-w-3xl">
        <Link
          href={`/students/${id}`}
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to profile
        </Link>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <AvatarInitials
                firstName={report.student.firstName}
                lastName={report.student.lastName}
                size={48}
              />
              <div>
                <div className="text-[20px] font-extrabold tracking-tight">
                  {report.student.firstName} {report.student.lastName}
                </div>
                <div className="text-[12.5px] text-mute-1">
                  {format(report.periodStart, "MMM d, yyyy")} →{" "}
                  {format(report.periodEnd, "MMM d, yyyy")}
                </div>
              </div>
            </div>
            <div className="text-right">
              {report.publishedAt ? (
                <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-success">
                  Published {format(report.publishedAt, "MMM d, yyyy")}
                </span>
              ) : (
                <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                  Draft
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Attendance" value={report.attendancePct != null ? `${report.attendancePct}%` : "—"} />
            <Stat
              label="Overall rating"
              value={
                report.overallRating ? (
                  <span className="inline-flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={cn(
                          i < report.overallRating!
                            ? "fill-brand text-brand-dim"
                            : "text-mute-3"
                        )}
                      />
                    ))}
                  </span>
                ) : (
                  "—"
                )
              }
            />
          </div>

          {report.narrative && (
            <Section title="Narrative">
              <p className="whitespace-pre-wrap">{report.narrative}</p>
            </Section>
          )}

          {report.goals && (
            <Section title="Goals for next period">
              <p className="whitespace-pre-wrap">{report.goals}</p>
            </Section>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-mute-4/40 border border-border rounded-[var(--radius-sm)] p-3">
      <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
        {label}
      </div>
      <div className="text-[18px] font-extrabold mt-0.5">{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-section-header mb-1.5">{title}</h3>
      <div className="text-[14px] leading-relaxed text-foreground">{children}</div>
    </div>
  );
}
