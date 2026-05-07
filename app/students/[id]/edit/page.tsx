import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StudentForm } from "@/components/students/StudentForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) notFound();

  return (
    <AppShell title={`Edit ${student.firstName} ${student.lastName}`}>
      <div className="space-y-4">
        <Link
          href={`/students/${student.id}`}
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to profile
        </Link>
        <StudentForm
          initial={{
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            phone: student.phone,
            parentName: student.parentName,
            parentEmail: student.parentEmail,
            parentPhone: student.parentPhone,
            grade: student.grade,
            gradYear: student.gradYear,
            track: student.track,
            notes: student.notes,
          }}
        />
      </div>
    </AppShell>
  );
}
