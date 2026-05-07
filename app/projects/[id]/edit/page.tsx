import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const p = await prisma.project.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <AppShell title={`Edit ${p.name}`}>
      <div className="space-y-4">
        <Link
          href={`/projects/${p.id}`}
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to project
        </Link>
        <ProjectForm
          initial={{
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            startDate: p.startDate,
            endDate: p.endDate,
          }}
        />
      </div>
    </AppShell>
  );
}
