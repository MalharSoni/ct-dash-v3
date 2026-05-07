import { AppShell } from "@/components/layout/AppShell";
import { CardsSkeleton } from "@/components/system/PageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Projects">
      <CardsSkeleton count={6} />
    </AppShell>
  );
}
