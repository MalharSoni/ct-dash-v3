import Link from "next/link";
import { Plus, Trophy, Users2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const teams = await prisma.team.findMany({
    where: { active: true },
    orderBy: { teamNumber: "asc" },
    include: {
      season: true,
      _count: { select: { members: true, tasks: true } },
    },
  });

  return (
    <AppShell
      title="Teams"
      actions={
        <Button size="sm" asChild>
          <Link href="/teams/new">
            <Plus size={14} /> New team
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {teams.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No teams yet"
            description="Create competitive teams, assign students with roles, and manage in-team tasks."
            action={
              <Button size="sm" asChild>
                <Link href="/teams/new">
                  <Plus size={14} /> Create team
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((t) => (
              <Link
                key={t.id}
                href={`/teams/${t.id}`}
                className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 hover:shadow-card-hover transition-shadow group"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[15px] font-bold tracking-tight group-hover:text-brand-dim transition-colors">
                    {t.name}
                  </h3>
                  <span className="text-[12px] font-mono font-bold text-mute-1">
                    {t.teamNumber}
                  </span>
                </div>
                {t.description && (
                  <p className="text-[12.5px] text-mute-1 mt-1.5 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-4 text-[11.5px] text-mute-1">
                  <span className="inline-flex items-center gap-1">
                    <Users2 size={12} /> {t._count.members} members
                  </span>
                  <span>·</span>
                  <span>{t._count.tasks} tasks</span>
                </div>
                <div className="mt-1 text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
                  {t.season.name}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
