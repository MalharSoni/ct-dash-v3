import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-4 space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatrixSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-48" />
      <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-2 py-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-12" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
