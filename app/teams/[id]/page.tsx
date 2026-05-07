import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { TeamMemberList } from "@/components/teams/TeamMemberList";
import { TaskBoard } from "@/components/teams/TaskBoard";
import { EventTimeline } from "@/components/teams/EventTimeline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      season: true,
      members: {
        include: { student: true },
        orderBy: { role: "asc" },
      },
      tasks: {
        include: {
          assignee: { include: { student: true } },
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      },
      events: {
        orderBy: { startAt: "asc" },
      },
    },
  });
  if (!team) notFound();

  const candidates = await prisma.student.findMany({
    where: {
      active: true,
      track: { in: ["FOUNDATION", "PROJECTS"] },
    },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <AppShell
      title={`${team.name} · ${team.teamNumber}`}
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/teams/${team.id}/edit`}>
            <Pencil size={14} /> Edit
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to teams
        </Link>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
          {team.description && (
            <p className="text-[14px] text-foreground whitespace-pre-wrap">
              {team.description}
            </p>
          )}
          <div className="mt-2 text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
            {team.season.name}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
            <TaskBoard
              teamId={team.id}
              tasks={team.tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                assignee: t.assignee
                  ? {
                      id: t.assignee.id,
                      student: {
                        firstName: t.assignee.student.firstName,
                        lastName: t.assignee.student.lastName,
                      },
                    }
                  : null,
              }))}
              members={team.members.map((m) => ({
                id: m.id,
                student: {
                  firstName: m.student.firstName,
                  lastName: m.student.lastName,
                },
              }))}
            />
          </div>

          <div className="space-y-4">
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
            <EventTimeline
              teamId={team.id}
              events={team.events.map((e) => ({
                id: e.id,
                type: e.type,
                title: e.title,
                startAt: e.startAt.toISOString(),
                endAt: e.endAt?.toISOString() ?? null,
                location: e.location,
                notes: e.notes,
              }))}
            />
          </div>
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
            <h3 className="text-section-header">Roster</h3>
            <TeamMemberList
              teamId={team.id}
              members={team.members.map((m) => ({
                id: m.id,
                studentId: m.studentId,
                role: m.role,
                student: {
                  firstName: m.student.firstName,
                  lastName: m.student.lastName,
                },
              }))}
              candidates={candidates}
            />
          </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
