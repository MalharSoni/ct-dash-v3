import Link from "next/link";
import { format, subDays, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RosterRow } from "@/components/attendance/RosterRow";
import { BulkActions } from "@/components/attendance/BulkActions";
import { DatePicker } from "@/components/attendance/DatePicker";
import { ensureSession } from "./actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ d?: string }>;
}

function parseDate(s?: string) {
  if (!s) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(Date.UTC(y, m - 1, d));
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const { d } = await searchParams;
  const date = parseDate(d);
  const day = new Date(date);
  day.setUTCHours(0, 0, 0, 0);

  // Ensure a session exists for the chosen day so attendance can be marked.
  const session = await ensureSession(day);

  // Find the most recent prior session within the last 14 days for D2.
  const previousSession = await prisma.session.findFirst({
    where: { date: { lt: day, gte: subDays(day, 14) } },
    orderBy: { date: "desc" },
  });

  const [
    students,
    attendance,
    performance,
    xFactor,
    prevAttendance,
  ] = await Promise.all([
    prisma.student.findMany({
      where: { active: true, track: { in: ["FOUNDATION", "PROJECTS"] } },
      orderBy: [{ track: "asc" }, { lastName: "asc" }],
    }),
    prisma.attendanceRecord.findMany({ where: { sessionId: session.id } }),
    prisma.dailyPerformance.findMany({ where: { sessionId: session.id } }),
    prisma.xFactorNote.groupBy({
      by: ["studentId"],
      where: { sessionId: session.id },
      _count: true,
    }),
    previousSession
      ? prisma.attendanceRecord.findMany({
          where: { sessionId: previousSession.id },
        })
      : Promise.resolve([]),
  ]);

  const attMap = new Map(attendance.map((a) => [a.studentId, a]));
  const perfMap = new Map(performance.map((p) => [p.studentId, p.rating]));
  const xMap = new Map(xFactor.map((x) => [x.studentId, x._count]));

  const prevPresent = prevAttendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const prevTotal = prevAttendance.length;
  const prevStatusByStudent = new Map(
    prevAttendance.map((a) => [a.studentId, a.status])
  );

  // Stats
  const presentCount = attendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const totalCount = students.length;

  return (
    <AppShell title="Attendance">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[16px] font-bold">
              {format(day, "EEEE, MMMM d, yyyy")}
            </h2>
            <p className="text-[12.5px] text-mute-1">
              {presentCount} of {totalCount} marked present.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="outline" size="icon" className="size-8">
              <Link
                href={`/attendance?d=${format(subDays(day, 1), "yyyy-MM-dd")}`}
                aria-label="Previous day"
                prefetch={false}
              >
                <ChevronLeft size={14} />
              </Link>
            </Button>
            <DatePicker date={format(day, "yyyy-MM-dd")} />
            <Button asChild variant="outline" size="icon" className="size-8">
              <Link
                href={`/attendance?d=${format(addDays(day, 1), "yyyy-MM-dd")}`}
                aria-label="Next day"
                prefetch={false}
              >
                <ChevronRight size={14} />
              </Link>
            </Button>
            {format(day, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") && (
              <Button asChild variant="ghost" size="sm" className="ml-1">
                <Link href="/attendance" prefetch={false}>
                  Today
                </Link>
              </Button>
            )}
          </div>
        </div>

        {previousSession && prevTotal > 0 && (
          <div className="bg-card border border-border rounded-[var(--radius-sm)] p-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
            <span className="text-mute-1">
              Last session{" "}
              <span className="font-semibold text-foreground">
                {format(previousSession.date, "EEE, MMM d")}
              </span>
              :{" "}
              <strong className="text-foreground">{prevPresent}</strong> of{" "}
              <strong>{prevTotal}</strong> attended (
              {Math.round((prevPresent / prevTotal) * 100)}%)
            </span>
            <a
              href={`/attendance?d=${format(previousSession.date, "yyyy-MM-dd")}`}
              className="text-[12px] font-semibold text-mute-1 hover:text-foreground"
            >
              View →
            </a>
          </div>
        )}

        {students.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No active students"
            description="Add students to take attendance."
          />
        ) : (
          <>
          <BulkActions
            sessionId={session.id}
            studentIds={students.map((s) => s.id)}
            unmarkedIds={students.filter((s) => !attMap.has(s.id)).map((s) => s.id)}
            priorStatus={Object.fromEntries(
              students.map((s) => [s.id, attMap.get(s.id)?.status ?? null])
            )}
          />
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="bg-mute-4 border-b border-border text-left">
                  <th className="text-table-head px-4 py-2.5 sticky left-0 bg-mute-4 z-10">Student</th>
                  <th className="text-table-head px-2 py-2.5 w-44">Status</th>
                  <th className="text-table-head px-2 py-2.5 w-44">Rating</th>
                  <th className="text-table-head px-2 py-2.5 w-44">Note</th>
                  <th className="text-table-head px-2 py-2.5 w-28">X-Factor</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const a = attMap.get(s.id);
                  return (
                    <RosterRow
                      key={s.id}
                      sessionId={session.id}
                      student={{
                        id: s.id,
                        firstName: s.firstName,
                        lastName: s.lastName,
                        track: s.track,
                      }}
                      attendance={a?.status ?? null}
                      rating={perfMap.get(s.id) ?? null}
                      notes={a?.notes ?? null}
                      xFactorCount={xMap.get(s.id) ?? 0}
                      lastStatus={prevStatusByStudent.get(s.id) ?? null}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        <div className="text-[11.5px] text-mute-1 flex flex-wrap gap-x-4 gap-y-1">
          <span>
            <strong>P</strong> Present
          </span>
          <span>
            <strong>L</strong> Late
          </span>
          <span>
            <strong>E</strong> Excused
          </span>
          <span>
            <strong>A</strong> Absent
          </span>
          <span>·</span>
          <span>Rating disabled until status is set (and not Absent).</span>
        </div>
      </div>
    </AppShell>
  );
}
