import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  meta?: string;
  trend?: { value: string; positive?: boolean };
  icon?: LucideIcon;
  accent?: "brand" | "destructive" | "success" | "info" | "default";
  className?: string;
}

const accentBorders: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "border-t-brand",
  destructive: "border-t-destructive",
  success: "border-t-success",
  info: "border-t-info",
  default: "",
};

export function StatCard({
  label,
  value,
  meta,
  trend,
  icon: Icon,
  accent = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-[var(--radius)] border border-border p-5 shadow-card",
        "transition-shadow hover:shadow-card-hover",
        accent !== "default" && "border-t-[3px]",
        accent !== "default" && accentBorders[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-stat-label">{label}</span>
        {Icon && <Icon size={18} className="text-mute-2 shrink-0" />}
      </div>
      <div className="text-stat-value text-foreground">{value}</div>
      {(meta || trend) && (
        <div className="mt-2 flex items-center gap-2 text-[11.5px] text-mute-1 font-medium">
          {trend && (
            <span
              className={cn(
                "font-bold",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.value}
            </span>
          )}
          {meta && <span>{meta}</span>}
        </div>
      )}
    </div>
  );
}
