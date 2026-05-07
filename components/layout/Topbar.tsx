import { prisma } from "@/lib/prisma";
import { getCurrentCoach } from "@/lib/current-coach";
import { CoachSwitcher } from "./CoachSwitcher";
import { CommandPaletteTrigger } from "@/components/system/CommandPalette";
import { Breadcrumbs } from "./Breadcrumbs";

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export async function Topbar({ title, actions }: TopbarProps) {
  const [active, coaches] = await Promise.all([
    getCurrentCoach(),
    prisma.coach.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="h-full px-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-page-title text-foreground truncate">{title}</h1>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        {actions}

        <CommandPaletteTrigger />

        <CoachSwitcher activeCoachId={active.id} coaches={coaches} />
      </div>
    </div>
  );
}
