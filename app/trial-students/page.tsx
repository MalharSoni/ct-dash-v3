import Link from "next/link";
import { format, isFuture, isToday } from "date-fns";
import { Plus, Sparkles, Clock } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TrialStatusInline } from "@/components/trials/TrialStatusInline";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export default async function TrialStudentsPage() {
  const trials = await prisma.trialStudent.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { assessment: true },
  });

  // Group by Saturday week (date-only)
  const groups = new Map<
    string,
    { date: Date; items: typeof trials }
  >();
  for (const t of trials) {
    const d = new Date(t.scheduledAt);
    const key = d.toDateString();
    const g = groups.get(key);
    if (g) g.items.push(t);
    else groups.set(key, { date: d, items: [t] });
  }

  const groupArr = Array.from(groups.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return (
    <AppShell
      title="Trial Students"
      actions={
        <Button size="sm" asChild>
          <Link href="/trial-students/new">
            <Plus size={14} /> New trial
          </Link>
        </Button>
      }
    >
      <div className="space-y-5">
        <p className="text-[13px] text-mute-1">
          Schedule trials per Saturday timeslot. After the session, log an
          assessment so admin can decide on enrolment.
        </p>

        {groupArr.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No trials scheduled"
            description="Schedule a trial for an upcoming Saturday."
            action={
              <Button size="sm" asChild>
                <Link href="/trial-students/new">
                  <Plus size={14} /> Schedule trial
                </Link>
              </Button>
            }
          />
        ) : (
          groupArr.map((g) => (
            <section key={g.date.toISOString()} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-section-header">
                  {format(g.date, "EEEE, MMMM d")}
                  {isToday(g.date) && (
                    <span className="ml-2 text-[10.5px] uppercase tracking-[0.05em] font-bold text-brand-dim bg-brand-bg border border-brand-dim/30 px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                </h3>
                <span className="text-[12px] text-mute-1">
                  {g.items.length} trial{g.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-mute-4 border-b border-border text-left">
                      <th className="text-table-head px-4 py-2.5">Name</th>
                      <th className="text-table-head px-4 py-2.5 w-32">Time</th>
                      <th className="text-table-head px-4 py-2.5 w-32">Timeslot</th>
                      <th className="text-table-head px-4 py-2.5 w-32">Status</th>
                      <th className="text-table-head px-4 py-2.5 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b last:border-b-0 border-border hover:bg-mute-4/40 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/trial-students/${t.id}`}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {t.firstName} {t.lastName}
                          </Link>
                          {t.parentName && (
                            <div className="text-[11.5px] text-mute-1">
                              Parent: {t.parentName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[12px] text-mute-1">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={11} /> {format(t.scheduledAt, "HH:mm")}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-mute-1 text-[12px]">
                          {t.timeslot}
                        </td>
                        <td className="px-4 py-2.5">
                          <TrialStatusInline id={t.id} current={t.status} />
                          {t.assessment && (
                            <span className="ml-2 text-[10.5px] text-mute-1">
                              Assessed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={`/trial-students/${t.id}`}
                            className="text-[12px] font-semibold text-mute-1 hover:text-foreground"
                          >
                            {isFuture(t.scheduledAt) ? "Edit" : "Assess"} →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
