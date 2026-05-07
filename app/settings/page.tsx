import { AppShell } from "@/components/layout/AppShell";
import { SeasonsManager } from "@/components/settings/SeasonsManager";
import { CoachesManager } from "@/components/settings/CoachesManager";
import { TimeslotsManager } from "@/components/settings/TimeslotsManager";
import { OrgSettingsManager } from "@/components/settings/OrgSettingsManager";
import { prisma } from "@/lib/prisma";
import { getOrgSettings } from "./coach-actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [seasons, coaches, timeslots, org] = await Promise.all([
    prisma.season.findMany({ orderBy: { startDate: "desc" } }),
    prisma.coach.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.curriculumTimeslot.findMany({ orderBy: { order: "asc" } }),
    getOrgSettings(),
  ]);

  return (
    <AppShell title="Settings">
      <div className="space-y-6 max-w-3xl">
        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
          <OrgSettingsManager
            org={{
              orgName: org.orgName,
              publicHeading: org.publicHeading,
              publicTagline: org.publicTagline,
              reportFooter: org.reportFooter,
            }}
          />
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
          <SeasonsManager
            seasons={seasons.map((s) => ({
              id: s.id,
              name: s.name,
              current: s.current,
              startDate: s.startDate,
              endDate: s.endDate,
            }))}
          />
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
          <CoachesManager
            coaches={coaches.map((c) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              active: c.active,
            }))}
          />
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
          <TimeslotsManager
            timeslots={timeslots.map((t) => ({
              id: t.id,
              name: t.name,
              startTime: t.startTime,
              endTime: t.endTime,
              order: t.order,
            }))}
          />
        </div>
      </div>
    </AppShell>
  );
}
