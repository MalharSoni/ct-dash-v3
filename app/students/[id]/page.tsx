import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronLeft,
  Pencil,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  Users2,
  FileText,
  Plus,
  FolderKanban,
  Trophy,
  Sparkles,
  ClipboardCheck,
  StickyNote,
  MessageCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { CoachNotesFeed } from "@/components/students/CoachNotesFeed";
import { PerformanceTrend } from "@/components/students/AttendanceHistory";
import {
  SessionLog,
  type SessionLogEntry,
} from "@/components/students/SessionLog";
import { XFactorFeed } from "@/components/students/XFactorFeed";
import { SkillsManager } from "@/components/students/SkillsManager";
import { TrackSwitcher } from "@/components/students/TrackSwitcher";
import { RemoveStudentButton } from "@/components/students/RemoveStudentButton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      teamMemberships: {
        where: { active: true },
        include: { team: { include: { season: true } } },
      },
      coachNotes: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { coach: true },
      },
      reportCards: {
        orderBy: { periodEnd: "desc" },
        take: 10,
      },
      attendance: {
        orderBy: { session: { date: "desc" } },
        include: { session: true },
        take: 30,
      },
      performance: {
        include: { session: true },
      },
      xFactorNotes: {
        orderBy: { createdAt: "desc" },
        include: { recordedBy: true, session: true },
      },
      studentSkills: {
        include: { skill: true },
        orderBy: { skill: { category: "asc" } },
      },
      projectMembers: {
        include: { project: true },
      },
    },
  });

  if (!student) notFound();

  // Build per-session log: one entry per session date, merging attendance
  // status, performance rating, the in-row session note, and any x-factor
  // notes captured that session. The same entries also feed the performance
  // trend and the per-session stats below.
  const sessionMap = new Map<string, SessionLogEntry>();
  function ensure(sessionId: string, isoDate: string): SessionLogEntry {
    let entry = sessionMap.get(sessionId);
    if (!entry) {
      entry = {
        date: isoDate,
        status: null,
        rating: null,
        note: null,
        xFactors: [],
      };
      sessionMap.set(sessionId, entry);
    }
    return entry;
  }
  for (const a of student.attendance) {
    const entry = ensure(a.session.id, a.session.date.toISOString());
    entry.status = a.status;
    entry.note = a.notes;
  }
  for (const p of student.performance) {
    const entry = ensure(p.sessionId, p.session.date.toISOString());
    entry.rating = p.rating;
  }
  for (const xf of student.xFactorNotes) {
    if (!xf.sessionId || !xf.session) continue;
    const entry = ensure(xf.sessionId, xf.session.date.toISOString());
    entry.xFactors.push({
      id: xf.id,
      note: xf.note,
      tags: xf.tags,
      recordedBy: { name: xf.recordedBy.name },
    });
  }
  const sessionEntries = Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Lightweight {date, rating} series for the trend sparkline.
  const trendItems = sessionEntries.map((e) => ({
    date: e.date,
    status: e.status,
    rating: e.rating,
    hasXFactor: e.xFactors.length > 0,
  }));

  const presentCount = student.attendance.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = student.attendance.length > 0
    ? Math.round((presentCount / student.attendance.length) * 100)
    : null;
  const avgRating = student.performance.length > 0
    ? (
        student.performance.reduce((s, p) => s + p.rating, 0) /
        student.performance.length
      ).toFixed(1)
    : null;

  return (
    <AppShell
      title={`${student.firstName} ${student.lastName}`}
      actions={
        <Button size="sm" asChild>
          <Link href={`/students/${student.id}/edit`}>
            <Pencil size={14} /> Edit
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={14} /> Back to students
        </Link>

        {/* Hero */}
        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-hidden">
          <div className="p-5 flex items-start gap-5">
            <AvatarInitials
              firstName={student.firstName}
              lastName={student.lastName}
              size={64}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[22px] font-extrabold tracking-tight text-foreground">
                  {student.firstName} {student.lastName}
                </h2>
                <TrackSwitcher studentId={student.id} current={student.tracks} />
                {!student.active && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border bg-mute-3 text-mute-1 border-mute-3">
                    Inactive
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-mute-1">
                {student.grade && (
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={13} />
                    Grade {student.grade}
                    {student.gradYear ? ` · '${String(student.gradYear).slice(2)}` : ""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  Joined {format(student.joinedAt, "MMM d, yyyy")}
                </span>
                {student.teamMemberships.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users2 size={13} />
                    {student.teamMemberships
                      .map((m) => m.team.teamNumber)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-border bg-mute-4/40 divide-x divide-y sm:divide-y-0 divide-border">
            <HeroStat
              icon={ClipboardCheck}
              label="Attendance"
              value={attendanceRate != null ? `${attendanceRate}%` : "—"}
              hint={
                attendanceRate != null
                  ? `${presentCount}/${student.attendance.length}`
                  : "No data"
              }
            />
            <HeroStat
              icon={Sparkles}
              label="Avg rating"
              value={avgRating ?? "—"}
              hint={
                avgRating != null
                  ? `${student.performance.length} sessions`
                  : "No data"
              }
            />
            <HeroStat
              icon={StickyNote}
              label="Coach notes"
              value={String(student.coachNotes.length)}
              hint={
                student.coachNotes.filter((n) => n.pinned).length > 0
                  ? `${student.coachNotes.filter((n) => n.pinned).length} pinned`
                  : "—"
              }
            />
            <HeroStat
              icon={Trophy}
              label="Skills tracked"
              value={String(student.studentSkills.length)}
              hint={
                student.xFactorNotes.length > 0
                  ? `${student.xFactorNotes.length} x-factor`
                  : "—"
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
          {/* Left — single card with tabs as a header strip so the tabs are
              visually attached to the content below them. */}
          <Tabs
            defaultValue="overview"
            className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-hidden min-w-0"
          >
            <TabsList
              variant="line"
              className="w-full justify-start gap-0 rounded-none border-b border-border bg-card px-3 h-11"
            >
              <CardTab value="overview" label="Overview" />
              <CardTab
                value="notes"
                label="Notes"
                count={student.coachNotes.length}
              />
              <CardTab
                value="sessions"
                label="Sessions"
                count={sessionEntries.length}
              />
              <CardTab
                value="xfactor"
                label="X-Factor"
                count={student.xFactorNotes.length}
              />
              <CardTab
                value="skills"
                label="Skills"
                count={student.studentSkills.length}
              />
            </TabsList>

            <TabsContent
              value="overview"
              className="p-5 space-y-4 outline-none focus-visible:ring-0"
            >
              <div className="space-y-2">
                <h3 className="text-section-header">Performance trend</h3>
                <PerformanceTrend items={trendItems} />
              </div>
              {student.notes && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h3 className="text-section-header">About</h3>
                  <p className="text-[13px] whitespace-pre-wrap text-foreground">
                    {student.notes}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="notes"
              className="p-5 outline-none focus-visible:ring-0"
            >
              <CoachNotesFeed
                studentId={student.id}
                notes={student.coachNotes.map((n) => ({
                  id: n.id,
                  body: n.body,
                  pinned: n.pinned,
                  createdAt: n.createdAt.toISOString(),
                  coach: { name: n.coach.name },
                }))}
              />
            </TabsContent>

            <TabsContent
              value="sessions"
              className="p-5 outline-none focus-visible:ring-0"
            >
              <SessionLog entries={sessionEntries} />
            </TabsContent>

            <TabsContent
              value="xfactor"
              className="p-5 outline-none focus-visible:ring-0"
            >
              <XFactorFeed
                notes={student.xFactorNotes.map((n) => ({
                  id: n.id,
                  note: n.note,
                  tags: n.tags,
                  createdAt: n.createdAt.toISOString(),
                  recordedBy: { name: n.recordedBy.name },
                  sessionDate: n.session?.date.toISOString() ?? null,
                }))}
              />
            </TabsContent>

            <TabsContent
              value="skills"
              className="p-5 outline-none focus-visible:ring-0"
            >
              <SkillsManager
                studentId={student.id}
                skills={student.studentSkills.map((s) => ({
                  id: s.id,
                  level: s.level,
                  evidence: s.evidence,
                  skill: {
                    id: s.skill.id,
                    name: s.skill.name,
                    category: s.skill.category,
                  },
                }))}
              />
            </TabsContent>
          </Tabs>

          {/* Right — sidebar (Contact, Memberships, Reports). */}
          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--topbar-height)+16px)]">
            <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
              <h3 className="text-section-header">Contact</h3>
              <dl className="space-y-2.5 text-[13px]">
                <ContactRow icon={Mail} label="Email" value={student.email} mailto />
                <ContactRow icon={Phone} label="Phone" value={student.phone} tel />
                <ContactRow
                  icon={Users2}
                  label="Parent / Guardian"
                  value={student.parentName}
                />
                <ContactRow
                  icon={Mail}
                  label="Parent email"
                  value={student.parentEmail}
                  mailto
                />
                <ContactRow
                  icon={Phone}
                  label="Parent phone"
                  value={student.parentPhone}
                  tel
                />
                <ContactRow
                  icon={MessageCircle}
                  label={
                    student.commPref === "WECHAT"
                      ? "WeChat ID"
                      : "Prefers WhatsApp"
                  }
                  value={
                    student.commPref === "WECHAT"
                      ? student.parentWechat
                      : student.parentPhone
                  }
                />
              </dl>
            </div>

            {(student.teamMemberships.length > 0 ||
              student.projectMembers.length > 0) && (
              <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
                <h3 className="text-section-header">Memberships</h3>
                {student.teamMemberships.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                      Teams
                    </div>
                    <ul className="space-y-1">
                      {student.teamMemberships.map((m) => (
                        <li key={m.id}>
                          <Link
                            href={`/teams/${m.team.id}`}
                            className="flex items-center gap-2 text-[13px] hover:underline"
                          >
                            <Trophy size={12} className="text-mute-1" />
                            <span className="font-mono font-bold">
                              {m.team.teamNumber}
                            </span>
                            <span className="truncate">{m.team.name}</span>
                            <span className="text-[11px] text-mute-1 ml-auto shrink-0">
                              {m.role}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {student.projectMembers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                      Projects
                    </div>
                    <ul className="space-y-1">
                      {student.projectMembers.map((m) => (
                        <li key={m.id}>
                          <Link
                            href={`/projects/${m.project.id}`}
                            className="flex items-center gap-2 text-[13px] hover:underline"
                          >
                            <FolderKanban size={12} className="text-mute-1" />
                            <span className="truncate">{m.project.name}</span>
                            {m.role && (
                              <span className="text-[11px] text-mute-1 ml-auto shrink-0">
                                {m.role}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-section-header">Report cards</h3>
                <Link
                  href={`/students/${student.id}/reports/new`}
                  className="text-[12px] font-semibold text-mute-1 hover:text-foreground inline-flex items-center gap-1"
                >
                  <Plus size={12} /> New
                </Link>
              </div>
              {student.reportCards.length === 0 ? (
                <p className="text-[12.5px] text-mute-1">
                  No report cards yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {student.reportCards.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/students/${student.id}/reports/${r.id}`}
                        className="block px-2.5 py-2 rounded-[var(--radius-sm)] border border-border hover:border-mute-2 hover:bg-mute-4/40 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[12.5px] font-semibold">
                            <FileText size={12} className="text-mute-1" />
                            {format(r.periodStart, "MMM d")} →{" "}
                            {format(r.periodEnd, "MMM d, yyyy")}
                          </div>
                          {r.publishedAt ? (
                            <span className="text-[10px] uppercase tracking-[0.05em] font-bold text-success">
                              Published
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase tracking-[0.05em] font-bold text-mute-1">
                              Draft
                            </span>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Danger zone */}
            <div className="rounded-[var(--radius)] border border-destructive/30 bg-destructive/5 p-5 space-y-3">
              <div>
                <h3 className="text-[13px] font-bold text-destructive">
                  Danger zone
                </h3>
                <p className="text-[11.5px] text-mute-1 mt-0.5">
                  Permanently removes this student and every record attached
                  (notes, attendance, skills, reports). This can&apos;t be undone.
                </p>
              </div>
              <RemoveStudentButton
                studentId={student.id}
                studentName={student.firstName}
              />
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function CardTab({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count?: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className="h-11 rounded-none px-3 text-[13px] font-semibold text-mute-1 data-active:text-foreground"
    >
      {label}
      {count != null && (
        <span className="ml-1 text-[11px] font-normal text-mute-2 tabular-nums">
          ({count})
        </span>
      )}
    </TabsTrigger>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  mailto,
  tel,
}: {
  icon: typeof Mail;
  label: string;
  value: string | null;
  mailto?: boolean;
  tel?: boolean;
}) {
  const href = value
    ? mailto
      ? `mailto:${value}`
      : tel
      ? `tel:${value.replace(/[^\d+]/g, "")}`
      : null
    : null;

  return (
    <div>
      <dt className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1 flex items-center gap-1.5">
        <Icon size={11} />
        {label}
      </dt>
      <dd className="mt-0.5 text-foreground">
        {value ? (
          href ? (
            <a href={href} className="text-info hover:underline">
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-mute-2">—</span>
        )}
      </dd>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="size-8 grid place-items-center rounded-md bg-card border border-border text-mute-1">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-mute-1">
          {label}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[16px] font-extrabold text-foreground tracking-tight tabular-nums">
            {value}
          </span>
          <span className="text-[11px] text-mute-1 truncate">{hint}</span>
        </div>
      </div>
    </div>
  );
}
