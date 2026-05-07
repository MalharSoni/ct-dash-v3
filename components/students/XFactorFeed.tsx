import { format, formatDistanceToNow } from "date-fns";
import { Star } from "lucide-react";

type Note = {
  id: string;
  note: string;
  tags: string[];
  createdAt: string;
  recordedBy: { name: string };
  sessionDate: string | null;
};

export function XFactorFeed({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <p className="text-[12.5px] text-mute-1">
        X-Factor moments captured during sessions will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((n) => (
        <div
          key={n.id}
          className="border border-border rounded-[var(--radius-sm)] p-3 bg-brand-bg/40"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.05em] text-mute-1 font-bold">
              <Star size={11} className="text-brand-dim" />
              <span>{n.recordedBy.name}</span>
              {n.sessionDate && (
                <>
                  <span>·</span>
                  <span>{format(new Date(n.sessionDate), "MMM d")}</span>
                </>
              )}
              <span>·</span>
              <span title={format(new Date(n.createdAt), "PPpp")}>
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
          <p className="text-[13px] text-foreground whitespace-pre-wrap">
            {n.note}
          </p>
          {n.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {n.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold uppercase tracking-[0.04em] bg-card border border-brand-dim/30 text-ink px-1.5 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
