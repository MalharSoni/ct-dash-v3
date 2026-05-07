"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls `router.refresh()` so server components re-fetch their data
 * automatically. Pauses while the tab is hidden to save bandwidth.
 *
 * Mounted globally in AppShell so every coach's open tab re-syncs from
 * the database — there is no in-memory cache to invalidate.
 */
export function LiveRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    function tick() {
      // Skip if tab is hidden — saves a network round-trip.
      if (document.hidden) return;
      lastRefresh.current = Date.now();
      router.refresh();
    }

    function handleVisibility() {
      // Force a refresh immediately when the tab becomes visible if it's
      // been longer than the interval since the last refresh.
      if (!document.hidden && Date.now() - lastRefresh.current > intervalMs) {
        tick();
      }
    }

    timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs, router]);

  return null;
}
