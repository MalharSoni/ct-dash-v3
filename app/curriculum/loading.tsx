import { AppShell } from "@/components/layout/AppShell";
import { MatrixSkeleton } from "@/components/system/PageSkeleton";

export default function Loading() {
  return (
    <AppShell title="Curriculum">
      <MatrixSkeleton />
    </AppShell>
  );
}
