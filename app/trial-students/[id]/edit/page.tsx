import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TrialForm } from "@/components/trials/TrialForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTrialPage({ params }: PageProps) {
  const { id } = await params;
  const t = await prisma.trialStudent.findUnique({ where: { id } });
  if (!t) notFound();

  return (
    <AppShell title={`Edit ${t.firstName} ${t.lastName}`}>
      <div className="space-y-4">
        <Link
          href={`/trial-students/${t.id}`}
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to trial
        </Link>
        <TrialForm
          initial={{
            id: t.id,
            firstName: t.firstName,
            lastName: t.lastName,
            parentName: t.parentName,
            parentEmail: t.parentEmail,
            parentPhone: t.parentPhone,
            grade: t.grade,
            scheduledAt: t.scheduledAt,
            timeslot: t.timeslot,
            notes: t.notes,
          }}
        />
      </div>
    </AppShell>
  );
}
