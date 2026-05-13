"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { PHASE_META, DEFAULT_COHORT } from "@/lib/curriculum";
import { EntryDialog } from "./EntryDialog";
import { WeekRowActions } from "./WeekRowActions";
import { TimeslotEditDialog } from "./TimeslotEditDialog";
import { removeEntry, moveEntry } from "@/app/curriculum/actions";
import type { TimeslotDTO, WeekDTO, EntryDTO } from "./types";
import type { CurriculumCohort } from "@prisma/client";

interface Props {
  weeks: WeekDTO[];
  timeslots: TimeslotDTO[];
  editable?: boolean;
  activeCohort?: CurriculumCohort;
}

export function CurriculumMatrix({
  weeks,
  timeslots,
  editable = false,
  activeCohort = DEFAULT_COHORT,
}: Props) {
  const [activeCell, setActiveCell] = useState<
    | { week: WeekDTO; timeslot: TimeslotDTO; entry: EntryDTO | null }
    | null
  >(null);
  const [activeTimeslot, setActiveTimeslot] = useState<TimeslotDTO | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const cols = timeslots.length;
  const gridTemplateColumns = `160px repeat(${cols}, minmax(0, 1fr))${
    editable ? " 36px" : ""
  }`;

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || !e.active) return;
    const entryId = String(e.active.id);
    const dest = String(e.over.id); // format: "week:<id>|ts:<id>"
    const m = dest.match(/^week:(.+)\|ts:(.+)$/);
    if (!m) return;
    const [, weekId, timeslotId] = m;
    moveEntry({ entryId, targetWeekId: weekId, targetTimeslotId: timeslotId })
      .then(() => toast.success("Moved"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"));
  }

  const grid = (
    <>
      <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-x-auto">
        <div
          className="min-w-[800px] grid text-[13px]"
          style={{ gridTemplateColumns }}
        >
          {/* HEADER */}
          <div className="bg-mute-4 border-b border-border px-3 py-3 text-table-head">
            Date
          </div>
          {timeslots.map((t) => {
            const headerInner = (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="text-table-head">{t.name}</span>
                  {editable && (
                    <Pencil
                      size={11}
                      className="text-mute-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
                <div className="text-[10.5px] font-mono text-mute-1 mt-0.5">
                  {t.startTime}–{t.endTime}
                </div>
              </>
            );
            if (editable) {
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTimeslot(t)}
                  className="group bg-mute-4 border-b border-l border-border px-3 py-3 text-left hover:bg-mute-3/40 transition-colors"
                >
                  {headerInner}
                </button>
              );
            }
            return (
              <div
                key={t.id}
                className="bg-mute-4 border-b border-l border-border px-3 py-3"
              >
                {headerInner}
              </div>
            );
          })}
          {editable && (
            <div className="bg-mute-4 border-b border-l border-border" />
          )}

          {/* ROWS */}
          {weeks.length === 0 && (
            <div
              className="col-span-full px-6 py-12 text-center text-mute-1"
              style={{ gridColumn: `1 / -1` }}
            >
              No Saturdays added yet.
              {editable && (
                <span className="block mt-1 text-[12px]">
                  Click <strong>Add Saturday</strong> to start.
                </span>
              )}
            </div>
          )}

          {weeks.map((week, wIdx) => {
            // Saturday is stored at UTC midnight. Convert to local-equivalent
            // for display so it renders the same calendar day everywhere.
            const utc = new Date(week.saturday);
            const sat = new Date(
              utc.getUTCFullYear(),
              utc.getUTCMonth(),
              utc.getUTCDate()
            );
            const isLast = wIdx === weeks.length - 1;
            const rowBorder = isLast ? "" : "border-b border-border";

            return (
              <RowFragment key={week.id}>
                {/* Date cell */}
                <div
                  className={cn(
                    "px-3 py-3 flex flex-col gap-0.5",
                    rowBorder,
                    week.isBreak && "bg-mute-4"
                  )}
                >
                  <span className="text-[13.5px] font-bold text-foreground">
                    {format(sat, "MMM d")}
                  </span>
                  <span className="text-[10.5px] font-mono text-mute-1">
                    {format(sat, "EEE · yyyy")}
                  </span>
                  {week.label && (
                    <span className="text-[10.5px] font-semibold text-mute-1 mt-1">
                      {week.label}
                    </span>
                  )}
                </div>

                {/* Break row spans across timeslots */}
                {week.isBreak ? (
                  <div
                    className={cn(
                      "px-4 py-3 border-l border-border bg-mute-4 flex items-center gap-2",
                      rowBorder
                    )}
                    style={{ gridColumn: `2 / span ${cols}` }}
                  >
                    <span className="size-1.5 rounded-full bg-mute-1" />
                    <span className="text-[12.5px] font-semibold text-mute-1">
                      {week.breakNote || "Break"}
                    </span>
                  </div>
                ) : (
                  timeslots.map((t) => {
                    const entry =
                      week.entries.find(
                        (e) => e.timeslotId === t.id && e.cohort === activeCohort
                      ) ?? null;
                    return (
                      <Cell
                        key={t.id}
                        week={week}
                        timeslot={t}
                        entry={entry}
                        editable={editable}
                        rowBorder={rowBorder}
                        onClick={
                          editable
                            ? () =>
                                setActiveCell({ week, timeslot: t, entry })
                            : undefined
                        }
                      />
                    );
                  })
                )}

                {/* Row action menu (editable only) */}
                {editable && (
                  <div
                    className={cn(
                      "border-l border-border flex items-start justify-center pt-3",
                      rowBorder
                    )}
                  >
                    <WeekRowActions week={week} />
                  </div>
                )}
              </RowFragment>
            );
          })}
        </div>
      </div>

      {editable && activeCell && (
        <EntryDialog
          open={!!activeCell}
          onOpenChange={(v) => !v && setActiveCell(null)}
          week={activeCell.week}
          timeslot={activeCell.timeslot}
          entry={activeCell.entry}
          defaultCohort={activeCohort}
        />
      )}

      {editable && activeTimeslot && (
        <TimeslotEditDialog
          open={!!activeTimeslot}
          onOpenChange={(v) => !v && setActiveTimeslot(null)}
          timeslot={activeTimeslot}
        />
      )}
    </>
  );

  if (editable) {
    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {grid}
      </DndContext>
    );
  }
  return grid;
}

// Fragment wrapper that's typed correctly with grid items
function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Cell({
  week,
  timeslot,
  entry,
  editable,
  rowBorder,
  onClick,
}: {
  week: WeekDTO;
  timeslot: TimeslotDTO;
  entry: EntryDTO | null;
  editable: boolean;
  rowBorder: string;
  onClick?: () => void;
}) {
  const dropId = `week:${week.id}|ts:${timeslot.id}`;

  if (!entry) {
    if (editable) {
      return <EmptyDroppableCell id={dropId} rowBorder={rowBorder} onClick={onClick} />;
    }
    return (
      <div className={cn("border-l border-border", rowBorder)} />
    );
  }

  const meta = PHASE_META[entry.phase];
  const cellClass = cn(
    "relative border-l border-border px-3 pt-3 pb-2.5 min-h-16 transition-colors overflow-hidden group/cell",
    rowBorder
  );

  if (editable) {
    return (
      <DraggableCell
        id={dropId}
        entryId={entry.id}
        cellClass={cellClass}
        meta={meta}
        entry={entry}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={cellClass}
      style={{ background: meta.bg, borderLeftColor: meta.border }}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: meta.ink }}
      />
      <span
        className="text-[9.5px] font-bold uppercase tracking-[0.06em] block"
        style={{ color: meta.ink }}
      >
        {meta.label}
      </span>
      <div className="text-[13px] font-semibold text-foreground leading-tight mt-0.5">
        {entry.title}
      </div>
      {entry.description && (
        <div className="text-[11.5px] text-mute-1 mt-1 line-clamp-2">
          {entry.description}
        </div>
      )}
    </div>
  );
}

function EmptyDroppableCell({
  id,
  rowBorder,
  onClick,
}: {
  id: string;
  rowBorder: string;
  onClick?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        "border-l border-border px-3 py-3 text-left text-[12px] text-mute-2 hover:bg-mute-4 hover:text-foreground transition-colors group flex items-center gap-1.5 min-h-16",
        isOver && "bg-brand-bg ring-2 ring-brand-dim",
        rowBorder
      )}
    >
      <Plus
        size={12}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      />
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        Add lesson
      </span>
    </button>
  );
}

function DraggableCell({
  id,
  entryId,
  cellClass,
  meta,
  entry,
  onClick,
}: {
  id: string;
  entryId: string;
  cellClass: string;
  meta: { ink: string; bg: string; border: string; label: string };
  entry: EntryDTO;
  onClick?: () => void;
}) {
  const drag = useDraggable({ id: entryId });
  const drop = useDroppable({ id });

  const ref = (el: HTMLDivElement | null) => {
    drag.setNodeRef(el);
    drop.setNodeRef(el);
  };

  const style: React.CSSProperties = {
    background: meta.bg,
    borderLeftColor: meta.border,
    transform: drag.transform
      ? `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`
      : undefined,
    opacity: drag.isDragging ? 0.4 : 1,
    zIndex: drag.isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={ref}
      className={cn(
        cellClass,
        "hover:brightness-95",
        drop.isOver && !drag.isDragging && "ring-2 ring-brand-dim"
      )}
      style={style}
    >
      {/* Drag handle (top-left, visible on hover) */}
      <button
        type="button"
        {...drag.listeners}
        {...drag.attributes}
        className="absolute top-1.5 left-1 z-20 size-5 rounded grid place-items-center text-mute-1 hover:text-foreground bg-card/80 border border-border opacity-0 group-hover/cell:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Drag lesson"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={11} />
      </button>

      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 w-full h-full text-left"
        aria-label="Edit lesson"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 pointer-events-none"
        style={{ background: meta.ink }}
      />
      <span
        className="text-[9.5px] font-bold uppercase tracking-[0.06em] block relative pointer-events-none pl-5"
        style={{ color: meta.ink }}
      >
        {meta.label}
      </span>
      <div className="text-[13px] font-semibold text-foreground leading-tight mt-0.5 relative pointer-events-none">
        {entry.title}
      </div>
      {entry.description && (
        <div className="text-[11.5px] text-mute-1 mt-1 line-clamp-2 relative pointer-events-none">
          {entry.description}
        </div>
      )}
      <CellQuickDelete entryId={entryId} />
    </div>
  );
}

function CellQuickDelete({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Remove this lesson?")) return;
    startTransition(async () => {
      try {
        await removeEntry(entryId);
        toast.success("Removed");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={isPending}
      aria-label="Delete lesson"
      className="absolute top-1.5 right-1.5 z-10 size-6 rounded-md bg-card/95 border border-border text-mute-1 hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center opacity-0 group-hover/cell:opacity-100 transition-opacity"
    >
      {isPending ? (
        <Loader2 size={11} className="animate-spin" />
      ) : (
        <Trash2 size={11} />
      )}
    </button>
  );
}
