import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TeamForm } from "@/components/teams/TeamForm";

export default function NewTeamPage() {
  return (
    <AppShell title="New team">
      <div className="space-y-4">
        <Link
          href="/teams"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to teams
        </Link>
        <TeamForm />
      </div>
    </AppShell>
  );
}
