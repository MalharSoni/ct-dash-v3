import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-dashed border-border rounded-[var(--radius)] bg-card/40",
        "py-14 px-6 grid place-items-center text-center",
        className
      )}
    >
      <div className="max-w-sm space-y-3">
        {Icon && (
          <div className="size-11 rounded-full bg-muted grid place-items-center mx-auto text-mute-1">
            <Icon size={20} />
          </div>
        )}
        <div>
          <h3 className="text-section-header">{title}</h3>
          {description && (
            <p className="mt-1 text-[13px] text-mute-1">{description}</p>
          )}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </div>
    </div>
  );
}
