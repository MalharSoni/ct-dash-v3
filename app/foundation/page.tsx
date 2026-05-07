import Link from "next/link";
import { format } from "date-fns";
import { Plus, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { EmptyState } from "@/components/ui/empty-state";
import { GraduateButton } from "@/components/students/GraduateButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FoundationPage() {
  const students = await prisma.student.findMany({
    where: { track: "FOUNDATION", active: true },
    orderBy: [{ joinedAt: "desc" }, { lastName: "asc" }],
  });

  return (
    <AppShell
      title="Foundation"
      actions={
        <Button size="sm" asChild>
          <Link href="/students/new?track=FOUNDATION">
            <Plus size={14} /> Add foundation student
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-[13px] text-mute-1">
          New students start here. When they finish foundation, graduate them
          to <strong>Projects</strong>.
        </p>

        {students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Foundation track is empty"
            description="Add a new foundation student to get started."
            action={
              <Button size="sm" asChild>
                <Link href="/students/new?track=FOUNDATION">
                  <Plus size={14} /> Add student
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-mute-4 border-b border-border text-left">
                  <th className="text-table-head px-4 py-2.5">Name</th>
                  <th className="text-table-head px-4 py-2.5 w-20">Grade</th>
                  <th className="text-table-head px-4 py-2.5 w-32">Joined</th>
                  <th className="text-table-head px-4 py-2.5 w-32">Action</th>
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
                          {s.parentName && (
                            <div className="text-[11.5px] text-mute-1">
                              Parent: {s.parentName}
                            </div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-mute-1 font-mono text-[12px]">
                      {s.grade ? `Gr. ${s.grade}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-mute-1 text-[12px]">
                      {format(s.joinedAt, "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-2.5">
                      <GraduateButton id={s.id} />
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
