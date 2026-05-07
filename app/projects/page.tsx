import Link from "next/link";
import { format } from "date-fns";
import { Plus, FolderKanban, Users2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectStatusBadge } from "@/components/projects/StatusBadge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    where: { active: true },
    orderBy: { startDate: "desc" },
    include: {
      _count: { select: { members: true, weeklyProgress: true } },
    },
  });

  return (
    <AppShell
      title="Projects"
      actions={
        <Button size="sm" asChild>
          <Link href="/projects/new">
            <Plus size={14} /> New project
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create student-led projects, assign team members, and log weekly progress."
            action={
              <Button size="sm" asChild>
                <Link href="/projects/new">
                  <Plus size={14} /> Create project
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 hover:shadow-card-hover transition-shadow group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-[15px] font-bold tracking-tight group-hover:text-brand-dim transition-colors flex-1">
                    {p.name}
                  </h3>
                  <ProjectStatusBadge projectId={p.id} status={p.status} />
                </div>
                {p.description && (
                  <p className="text-[12.5px] text-mute-1 mt-1.5 line-clamp-2">
                    {p.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-[11.5px] text-mute-1">
                  <span className="inline-flex items-center gap-1">
                    <Users2 size={12} /> {p._count.members} members
                  </span>
                  <span>·</span>
                  <span>{p._count.weeklyProgress} updates</span>
                </div>
                <div className="mt-1 text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                  Started {format(p.startDate, "MMM d, yyyy")}
                  {p.endDate && ` → ${format(p.endDate, "MMM d, yyyy")}`}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
