import { AppShell } from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/system/PageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Students">
      <PageSkeleton rows={10} />
    </AppShell>
  );
}
