import { format } from "date-fns";
import type { AttendanceStatus } from "@prisma/client";

type Item = {
  date: string;
  status: AttendanceStatus | null;
  rating: number | null;
  hasXFactor: boolean;
};

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
