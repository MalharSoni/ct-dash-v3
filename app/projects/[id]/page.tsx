import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ChevronLeft, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { MemberManager } from "@/components/projects/MemberManager";
import { ProgressLog } from "@/components/projects/ProgressLog";
import { ProjectStatusBadge } from "@/components/projects/StatusBadge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: { student: true },
        orderBy: { joinedAt: "asc" },
      },
      weeklyProgress: {
        orderBy: { weekOf: "desc" },
        include: {
          loggedBy: true,
          student: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!project) notFound();

  const candidates = await prisma.student.findMany({
    where: { active: true, track: { in: ["FOUNDATION", "PROJECTS"] } },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <AppShell
      title={project.name}
      actions={
        <>
          <ProjectStatusBadge
            projectId={project.id}
            status={project.status}
            editable
          />
          <Button size="sm" variant="outline" asChild>
            <Link href={`/projects/${project.id}/edit`}>
              <Pencil size={14} /> Edit
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to projects
        </Link>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
          {project.description && (
            <p className="text-[14px] text-foreground whitespace-pre-wrap">
              {project.description}
            </p>
          )}
          <div className="mt-3 text-[11.5px] text-mute-1 font-mono">
            {format(project.startDate, "MMM d, yyyy")}
            {project.endDate && ` → ${format(project.endDate, "MMM d, yyyy")}`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 lg:col-span-2">
            <ProgressLog
              projectId={project.id}
              entries={project.weeklyProgress.map((e) => ({
                id: e.id,
                weekOf: e.weekOf.toISOString(),
                notes: e.notes,
                blockers: e.blockers,
                loggedBy: { name: e.loggedBy.name },
                student: e.student
                  ? { firstName: e.student.firstName, lastName: e.student.lastName }
                  : null,
              }))}
              members={project.members.map((m) => ({
                studentId: m.studentId,
                student: {
                  firstName: m.student.firstName,
                  lastName: m.student.lastName,
                },
              }))}
            />
          </div>

          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
            <h3 className="text-section-header">Members</h3>
            <MemberManager
              projectId={project.id}
              members={project.members.map((m) => ({
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
    </AppShell>
  );
}
