import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TeamForm } from "@/components/teams/TeamForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTeamPage({ params }: PageProps) {
  const { id } = await params;
  const t = await prisma.team.findUnique({ where: { id } });
  if (!t) notFound();

  return (
    <AppShell title={`Edit ${t.name}`}>
      <div className="space-y-4">
        <Link
          href={`/teams/${t.id}`}
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to team
        </Link>
        <TeamForm
          initial={{
            id: t.id,
            name: t.name,
            teamNumber: t.teamNumber,
            description: t.description,
          }}
        />
      </div>
    </AppShell>
  );
}
