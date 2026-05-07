import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { TrialForm } from "@/components/trials/TrialForm";

export default function NewTrialPage() {
  return (
    <AppShell title="Schedule trial">
      <div className="space-y-4">
        <Link
          href="/trial-students"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to trials
        </Link>
        <TrialForm />
      </div>
    </AppShell>
  );
}
