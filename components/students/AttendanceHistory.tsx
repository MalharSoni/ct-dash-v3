import { format } from "date-fns";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@prisma/client";

type Item = {
  date: string;
  status: AttendanceStatus | null;
  rating: number | null;
  hasXFactor: boolean;
};

const STATUS_CLR: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-amber-100 text-amber-700",
  EXCUSED: "bg-blue-100 text-blue-700",
  ABSENT: "bg-red-100 text-red-700",
};
const STATUS_LBL: Record<AttendanceStatus, string> = {
  PRESENT: "P",
  LATE: "L",
  EXCUSED: "E",
  ABSENT: "A",
};

export function AttendanceHistory({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="text-[12.5px] text-mute-1">No attendance recorded yet.</p>
    );
  }

  // Stats
  const counted = items.filter((i) => i.status !== null);
  const present = counted.filter(
    (i) => i.status === "PRESENT" || i.status === "LATE"
  ).length;
  const pct = counted.length > 0 ? Math.round((present / counted.length) * 100) : 0;
  const ratings = items.filter((i) => i.rating != null).map((i) => i.rating!);
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Sessions" value={counted.length} />
        <Stat label="Attendance" value={`${pct}%`} />
        <Stat label="Avg rating" value={avgRating ?? "—"} />
      </div>

      <div className="bg-card border border-border rounded-[var(--radius-sm)] overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-mute-4 text-left">
              <th className="text-table-head px-3 py-2">Date</th>
              <th className="text-table-head px-2 py-2 w-16">Status</th>
              <th className="text-table-head px-2 py-2 w-24">Rating</th>
              <th className="text-table-head px-2 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr
                key={i.date}
                className="border-t border-border last:border-b-0"
              >
                <td className="px-3 py-2 font-mono text-[11.5px]">
                  {format(new Date(i.date), "EEE, MMM d")}
                </td>
                <td className="px-2 py-2">
                  {i.status ? (
                    <span
                      className={cn(
                        "inline-grid place-items-center size-6 rounded text-[10px] font-bold",
                        STATUS_CLR[i.status]
                      )}
                    >
                      {STATUS_LBL[i.status]}
                    </span>
                  ) : (
                    <span className="text-mute-2">—</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  {i.rating != null ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={cn(
                            "size-2 rounded-sm",
                            n <= i.rating! ? "bg-brand" : "bg-mute-3"
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-mute-2 text-[11px]">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-right">
                  {i.hasXFactor && (
                    <Star size={12} className="text-brand-dim inline" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-mute-4/40 border border-border rounded-[var(--radius-sm)] p-2">
      <div className="text-[9.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
        {label}
      </div>
      <div className="text-[16px] font-extrabold mt-0.5">{value}</div>
    </div>
  );
}

export function PerformanceTrend({ items }: { items: Item[] }) {
  const series = items
    .filter((i) => i.rating != null)
    .slice(-12) // last 12 sessions
    .map((i) => ({ date: i.date, rating: i.rating! }));

  if (series.length === 0) {
    return (
      <p className="text-[12.5px] text-mute-1">
        Performance ratings will appear here once logged.
      </p>
    );
  }

  const max = 5;
  const w = 280;
  const h = 60;
  const stepX = series.length > 1 ? w / (series.length - 1) : 0;
  const points = series.map((s, i) => ({
    x: i * stepX,
    y: h - (s.rating / max) * h,
    rating: s.rating,
  }));
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div className="space-y-2">
      <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
        Last {series.length} session{series.length !== 1 ? "s" : ""}
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: 60 }}
      >
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#F5D000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F5D000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#grad)" />
        <path d={path} fill="none" stroke="#C8AA00" strokeWidth="1.6" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#171717" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-mute-2 font-mono">
        <span>{format(new Date(series[0].date), "MMM d")}</span>
        <span>{format(new Date(series[series.length - 1].date), "MMM d")}</span>
      </div>
    </div>
  );
}
