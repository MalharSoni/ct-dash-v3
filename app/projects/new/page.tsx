import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default function NewProjectPage() {
  return (
    <AppShell title="New project">
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to projects
        </Link>
        <ProjectForm />
      </div>
    </AppShell>
  );
}
