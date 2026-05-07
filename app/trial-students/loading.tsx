import { AppShell } from "@/components/layout/AppShell";
import { PageSkeleton } from "@/components/system/PageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Trial Students">
      <PageSkeleton rows={5} />
    </AppShell>
  );
}
