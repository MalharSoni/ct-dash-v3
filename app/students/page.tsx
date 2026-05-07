import Link from "next/link";
import { Prisma, type StudentTrack } from "@prisma/client";
import { Plus, Search, Users, FileStack } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentsTable } from "@/components/students/StudentsTable";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TRACK_TABS: { value: StudentTrack | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "FOUNDATION", label: "Foundation" },
  { value: "PROJECTS", label: "Projects" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "INACTIVE", label: "Inactive" },
];


interface PageProps {
  searchParams: Promise<{ q?: string; track?: string }>;
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const trackFilter = params.track && TRACK_TABS.some((t) => t.value === params.track)
    ? (params.track as StudentTrack | "ALL")
    : "ALL";

  const where: Prisma.StudentWhereInput = {};
  if (trackFilter !== "ALL") {
    where.tracks = { has: trackFilter };
  }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  // Pull all students once for the filter counts. Counting per-track via
  // groupBy doesn't work cleanly when a student can be on multiple tracks —
  // a student in [FOUNDATION, PROJECTS] should bump both counts.
  const [students, allForCounts] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ active: "desc" }, { lastName: "asc" }],
      take: 200,
    }),
    prisma.student.findMany({ select: { tracks: true } }),
  ]);

  const countByTrack: Record<string, number> = {
    ALL: allForCounts.length,
    FOUNDATION: 0,
    PROJECTS: 0,
    GRADUATED: 0,
    INACTIVE: 0,
  };
  for (const s of allForCounts) {
    for (const t of s.tracks) countByTrack[t] = (countByTrack[t] ?? 0) + 1;
  }

  return (
    <AppShell
      title="Students"
      actions={
        <>
          <Button size="sm" variant="outline" asChild>
            <Link href="/students/reports/bulk">
              <FileStack size={14} /> Bulk reports
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/students/new">
              <Plus size={14} /> New student
            </Link>
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex bg-card border border-border rounded-[var(--radius)] p-1 gap-1 shadow-card max-w-full overflow-x-auto no-scrollbar">
            {TRACK_TABS.map((t) => {
              const params = new URLSearchParams();
              if (t.value !== "ALL") params.set("track", t.value);
              if (q) params.set("q", q);
              const href = `/students${params.toString() ? `?${params}` : ""}`;
              const active = trackFilter === t.value;
              const count = countByTrack[t.value] ?? 0;
              return (
                <Link
                  key={t.value}
                  href={href}
                  className={cn(
                    "px-3 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0",
                    active
                      ? "bg-foreground text-background"
                      : "text-mute-1 hover:text-foreground"
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "text-[10.5px] font-bold rounded-full px-1.5 py-px",
                      active
                        ? "bg-background/20 text-background"
                        : "bg-mute-4 text-mute-1"
                    )}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>

          <form action="/students" className="relative w-full sm:w-auto sm:ml-auto">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-mute-2"
            />
            {trackFilter !== "ALL" && (
              <input type="hidden" name="track" value={trackFilter} />
            )}
            <Input
              name="q"
              placeholder="Search students…"
              defaultValue={q}
              className="pl-8 w-full sm:w-72"
            />
          </form>
        </div>

        {/* Table */}
        {students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={q ? "No students match" : "No students yet"}
            description={
              q
                ? "Try a different search."
                : "Add your first student to get started."
            }
            action={
              !q && (
                <Button size="sm" asChild>
                  <Link href="/students/new">
                    <Plus size={14} /> Add student
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <StudentsTable
            students={students.map((s) => ({
              id: s.id,
              firstName: s.firstName,
              lastName: s.lastName,
              email: s.email,
              grade: s.grade,
              track: s.track,
              tracks: s.tracks,
              joinedAt: s.joinedAt.toISOString(),
              active: s.active,
            }))}
          />
        )}
      </div>
    </AppShell>
  );
}
