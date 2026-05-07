import Link from "next/link";
import { Prisma, type StudentTrack } from "@prisma/client";
import { format } from "date-fns";
import { Plus, Search, Users, FileStack } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/empty-state";
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

const TRACK_BADGE: Record<StudentTrack, string> = {
  FOUNDATION: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROJECTS: "bg-amber-50 text-amber-700 border-amber-200",
  GRADUATED: "bg-blue-50 text-blue-700 border-blue-200",
  INACTIVE: "bg-mute-3 text-mute-1 border-mute-3",
};

const TRACK_LABEL: Record<StudentTrack, string> = {
  FOUNDATION: "Foundation",
  PROJECTS: "Projects",
  GRADUATED: "Graduated",
  INACTIVE: "Inactive",
};

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
  if (trackFilter !== "ALL") where.track = trackFilter;
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [students, counts] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ active: "desc" }, { lastName: "asc" }],
      take: 200,
    }),
    prisma.student.groupBy({
      by: ["track"],
      _count: true,
    }),
  ]);

  const countByTrack: Record<string, number> = { ALL: 0 };
  let total = 0;
  for (const c of counts) {
    countByTrack[c.track] = c._count;
    total += c._count;
  }
  countByTrack.ALL = total;

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
          <div className="inline-flex bg-card border border-border rounded-[var(--radius)] p-1 gap-1 shadow-card">
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
                    "px-3 py-1.5 rounded-[6px] text-[12.5px] font-semibold transition-colors flex items-center gap-1.5",
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

          <form action="/students" className="relative ml-auto">
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
              className="pl-8 w-72"
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
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-mute-4 border-b border-border text-left">
                  <th className="text-table-head px-4 py-2.5">Name</th>
                  <th className="text-table-head px-4 py-2.5 w-20">Grade</th>
                  <th className="text-table-head px-4 py-2.5 w-32">Track</th>
                  <th className="text-table-head px-4 py-2.5 w-32">Joined</th>
                  <th className="text-table-head px-4 py-2.5 w-32">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-b-0 border-border hover:bg-mute-4/40 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/students/${s.id}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <AvatarInitials
                          firstName={s.firstName}
                          lastName={s.lastName}
                          size={28}
                        />
                        <div>
                          <div className="font-semibold text-foreground group-hover:underline">
                            {s.firstName} {s.lastName}
                          </div>
                          {s.email && (
                            <div className="text-[11.5px] text-mute-1">
                              {s.email}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-mute-1 font-mono text-[12px]">
                      {s.grade ? `Gr. ${s.grade}` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border",
                          TRACK_BADGE[s.track]
                        )}
                      >
                        {TRACK_LABEL[s.track]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-mute-1 text-[12px]">
                      {format(s.joinedAt, "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.active ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-success font-medium">
                          <span className="size-1.5 bg-success rounded-full" />
                          Active
                        </span>
                      ) : (
                        <span className="text-mute-2 text-[12px]">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
