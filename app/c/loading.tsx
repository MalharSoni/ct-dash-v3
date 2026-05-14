import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-dvh">
      <header className="bg-ink">
        <div className="max-w-[1400px] mx-auto px-6 py-4 h-[64px]" />
      </header>
      <main className="max-w-[1400px] mx-auto px-6 py-8 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-7 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-80" />
        </div>
        <Skeleton className="h-[560px] w-full rounded-[var(--radius)]" />
      </main>
    </div>
  );
}
