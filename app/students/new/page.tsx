import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StudentForm } from "@/components/students/StudentForm";
import type { StudentTrack } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{ track?: string }>;
}

const VALID_TRACKS: StudentTrack[] = ["FOUNDATION", "PROJECTS", "GRADUATED", "INACTIVE"];

export default async function NewStudentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaultTrack: StudentTrack = VALID_TRACKS.includes(
    params.track as StudentTrack
  )
    ? (params.track as StudentTrack)
    : "FOUNDATION";

  return (
    <AppShell title="New student">
      <div className="space-y-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to students
        </Link>
        <StudentForm defaultTrack={defaultTrack} />
      </div>
    </AppShell>
  );
}
