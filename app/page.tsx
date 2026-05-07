import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { prisma } from "@/lib/prisma";
import {
  format,
  formatDistanceToNow,
  nextSaturday,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
} from "date-fns";
import {
  Users,
  Sparkles,
  GraduationCap,
  Trophy,
  Plus,
  ClipboardCheck,
  Star,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getDashboardStats() {
  const today = startOfDay(new Date());
  const upcomingSaturday = nextSaturday(today);
  const weekEnd = endOfDay(addDays(upcomingSaturday, 1));

  // Today's session attendance — at UTC midnight to match how sessions are stored.
  const todayUtc = new Date(today);
  todayUtc.setUTCHours(0, 0, 0, 0);
  const todaySession = await prisma.session.findUnique({
    where: { date: todayUtc },
    include: {
      _count: {
        select: {
          attendance: { where: { status: { in: ["PRESENT", "LATE"] } } },
        },
      },
    },
  });

  const [
    activeStudents,
    foundation,
    trialsThisWeek,
    activeTeams,
    upcomingTrials,
  ] = await Promise.all([
    prisma.student.count({
      where: {
        active: true,
        track: { in: ["FOUNDATION", "PROJECTS"] },
      },
    }),
    prisma.student.count({
      where: { active: true, track: "FOUNDATION" },
    }),
    prisma.trialStudent.count({
      where: {
        scheduledAt: { gte: today, lte: weekEnd },
        status: "SCHEDULED",
      },
    }),
    prisma.team.count({ where: { active: true } }),
    prisma.trialStudent.findMany({
      where: {
        scheduledAt: { gte: today },
        status: "SCHEDULED",
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  const presentToday = todaySession?._count.attendance ?? 0;

  // H1 — recent X-Factor highlights (last 14 days)
  const recentXFactor = await prisma.xFactorNote.findMany({
    where: { createdAt: { gte: subDays(today, 14) } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      recordedBy: { select: { name: true } },
    },
  });

  // H2 — needs attention
  const overdueTasks = await prisma.teamTask.findMany({
    where: {
      dueDate: { lt: today },
      status: { notIn: ["DONE"] },
    },
    orderBy: { dueDate: "asc" },
    take: 3,
    include: {
      team: { select: { id: true, teamNumber: true, name: true } },
    },
  });
  const upcomingTrialsToday = await prisma.trialStudent.count({
    where: {
      scheduledAt: { gte: today, lte: endOfDay(today) },
      status: "SCHEDULED",
    },
  });
  const trialsAwaitingAssessment = await prisma.trialStudent.count({
    where: {
      status: "ATTENDED",
      assessment: null,
    },
  });

  return {
    activeStudents,
    foundation,
    trialsThisWeek,
    activeTeams,
    upcomingTrials,
    presentToday,
    sessionStarted: !!todaySession,
    recentXFactor,
    overdueTasks,
    upcomingTrialsToday,
    trialsAwaitingAssessment,
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const today = new Date();

  return (
    <AppShell
      title="Dashboard"
      actions={
        <Button size="sm" asChild>
          <Link href="/attendance">
            <ClipboardCheck size={14} />
            Take attendance
          </Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Quick actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-[13px] text-mute-1">
            {format(today, "EEEE, MMMM d")} ·{" "}
            {stats.presentToday > 0
              ? `${stats.presentToday} of ${stats.activeStudents} present today`
              : "No attendance taken yet"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/trial-students">
                <Plus size={14} /> Trial
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/students/new?track=FOUNDATION">
                <Plus size={14} /> Foundation student
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Active students"
            value={stats.activeStudents}
            meta="Projects + foundation"
            icon={Users}
            accent="brand"
          />
          <StatCard
            label="Foundation"
            value={stats.foundation}
            meta="On track"
            icon={GraduationCap}
          />
          <StatCard
            label="Trials this week"
            value={stats.trialsThisWeek}
            meta="Saturday"
            icon={Sparkles}
          />
          <StatCard
            label="Active teams"
            value={stats.activeTeams}
            meta="Push Back season"
            icon={Trophy}
          />
        </div>

        {/* Today's session + upcoming trials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-[var(--radius)] p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-section-header">Today&apos;s session</h2>
              <a
                href="#"
                className="text-[12px] font-semibold text-mute-1 hover:text-foreground"
              >
                View →
              </a>
            </div>
            <p className="text-[13px] text-mute-1">
              {stats.presentToday > 0 ? (
                <>
                  <strong className="text-foreground">
                    {stats.presentToday}
                  </strong>{" "}
                  of {stats.activeStudents} students present so far. Continue
                  marking, logging performance, and capturing X-Factor notes.
                </>
              ) : (
                <>
                  Mark attendance, log daily performance, and capture X-Factor
                  notes for today&apos;s roster.
                </>
              )}
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link href="/attendance">
                <ClipboardCheck size={14} />
                {stats.presentToday > 0
                  ? "Continue session"
                  : "Open today's session"}
              </Link>
            </Button>
          </div>

          <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-card">
            <h2 className="text-section-header mb-3">Upcoming trials</h2>
            {stats.upcomingTrials.length === 0 ? (
              <p className="text-[13px] text-mute-1">No trials scheduled.</p>
            ) : (
              <ul className="space-y-3 text-[13px]">
                {stats.upcomingTrials.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      href={`/trial-students/${t.id}`}
                      className="font-medium hover:underline"
                    >
                      {t.firstName} {t.lastName}
                    </Link>
                    <span className="text-mute-1 text-[11.5px]">
                      {format(t.scheduledAt, "EEE · HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* X-Factor highlights + Needs attention */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* H1 — X-Factor highlights */}
          <div className="lg:col-span-2 bg-card border border-border rounded-[var(--radius)] p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-section-header inline-flex items-center gap-1.5">
                <Star size={14} className="text-brand-dim" /> Recent X-Factor
              </h2>
              <span className="text-[11px] text-mute-1">last 14 days</span>
            </div>
            {stats.recentXFactor.length === 0 ? (
              <p className="text-[13px] text-mute-1">
                Nothing logged in the last two weeks. Capture a moment during
                today&apos;s session.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.recentXFactor.map((n) => {
                  const created = new Date(n.createdAt);
                  return (
                    <li key={n.id} className="flex gap-3">
                      <Link
                        href={`/students/${n.student.id}`}
                        className="shrink-0"
                      >
                        <AvatarInitials
                          firstName={n.student.firstName}
                          lastName={n.student.lastName}
                          size={28}
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                          <Link
                            href={`/students/${n.student.id}`}
                            className="hover:underline text-foreground"
                          >
                            {n.student.firstName} {n.student.lastName}
                          </Link>
                          <span>·</span>
                          <span>{n.recordedBy.name}</span>
                          <span>·</span>
                          <span title={format(created, "PPpp")}>
                            {formatDistanceToNow(created, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[13px] text-foreground line-clamp-2 mt-0.5">
                          {n.note}
                        </p>
                        {n.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {n.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-[9.5px] font-semibold uppercase tracking-[0.04em] bg-brand-bg border border-brand-dim/30 text-ink px-1 py-0.5 rounded-full"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* H2 — Needs attention */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-card">
            <h2 className="text-section-header mb-3 inline-flex items-center gap-1.5">
              <AlertCircle size={14} className="text-warning" /> Needs attention
            </h2>
            {stats.overdueTasks.length === 0 &&
            stats.trialsAwaitingAssessment === 0 &&
            stats.upcomingTrialsToday === 0 ? (
              <p className="text-[13px] text-mute-1">All clear.</p>
            ) : (
              <ul className="space-y-2.5 text-[12.5px]">
                {stats.upcomingTrialsToday > 0 && (
                  <li>
                    <Link
                      href="/trial-students"
                      className="flex items-center gap-2 text-foreground hover:underline"
                    >
                      <Sparkles size={12} className="text-info" />
                      <span className="flex-1">
                        <strong>{stats.upcomingTrialsToday}</strong> trial
                        {stats.upcomingTrialsToday !== 1 ? "s" : ""} today
                      </span>
                      <ArrowUpRight size={12} className="text-mute-2" />
                    </Link>
                  </li>
                )}
                {stats.trialsAwaitingAssessment > 0 && (
                  <li>
                    <Link
                      href="/trial-students"
                      className="flex items-center gap-2 text-foreground hover:underline"
                    >
                      <Sparkles size={12} className="text-warning" />
                      <span className="flex-1">
                        <strong>{stats.trialsAwaitingAssessment}</strong> trial
                        {stats.trialsAwaitingAssessment !== 1 ? "s" : ""} need
                        assessment
                      </span>
                      <ArrowUpRight size={12} className="text-mute-2" />
                    </Link>
                  </li>
                )}
                {stats.overdueTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/teams/${t.team.id}`}
                      className="flex items-center gap-2 text-foreground hover:underline"
                    >
                      <Trophy size={12} className="text-destructive" />
                      <span className="flex-1 min-w-0 truncate">
                        <span className="font-mono text-[10.5px] text-mute-1">
                          {t.team.teamNumber}
                        </span>{" "}
                        {t.title}
                      </span>
                      <span className="text-[10.5px] text-destructive font-mono whitespace-nowrap">
                        {t.dueDate ? format(t.dueDate, "MMM d") : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
