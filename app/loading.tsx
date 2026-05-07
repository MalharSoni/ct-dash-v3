import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AppShell title="Loading…">
      <div className="space-y-6">
        <Skeleton className="h-5 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-44 rounded-[var(--radius)]" />
          <Skeleton className="h-44 rounded-[var(--radius)]" />
        </div>
      </div>
    </AppShell>
  );
}
