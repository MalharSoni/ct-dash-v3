"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Loader2, GripVertical, Copy, ClipboardPaste, Pencil } from "lucide-react";
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
import { MonthThemeDialog } from "./MonthThemeDialog";
import { WeekRowActions } from "./WeekRowActions";
import { TimeslotEditDialog } from "./TimeslotEditDialog";
import { removeEntry, moveEntry, upsertEntry } from "@/app/curriculum/actions";
import type { TimeslotDTO, WeekDTO, EntryDTO, MonthThemeDTO } from "./types";
import type { CurriculumCohort } from "@prisma/client";

interface Props {
  weeks: WeekDTO[];
  timeslots: TimeslotDTO[];
  monthThemes?: MonthThemeDTO[];
  editable?: boolean;
  activeCohort?: CurriculumCohort;
}

function yearMonthOf(iso: string) {
  return iso.slice(0, 7); // "YYYY-MM"
}

export function CurriculumMatrix({
  weeks,
  timeslots,
  monthThemes = [],
  editable = false,
  activeCohort = DEFAULT_COHORT,
}: Props) {
  const [activeMonth, setActiveMonth] = useState<
    | { yearMonth: string; existing: MonthThemeDTO | null }
    | null
  >(null);
  // Look up the theme for (month, activeCohort)
  const themesByKey = new Map(
    monthThemes
      .filter((m) => m.cohort === activeCohort)
      .map((m) => [m.yearMonth, m])
  );
  const [activeCell, setActiveCell] = useState<
    | { week: WeekDTO; timeslot: TimeslotDTO; entry: EntryDTO | null }
    | null
  >(null);
  const [activeTimeslot, setActiveTimeslot] = useState<TimeslotDTO | null>(null);

  // In-memory clipboard for copy/paste of cell entries. Stays alive until the
  // page navigates away. Pastes a fresh copy into the target cell and keeps
  // the original entry where it is. Cells stack cards, so pasting into a
  // non-empty cell just appends.
  const [clipboard, setClipboard] = useState<EntryDTO | null>(null);

  function handleCopyEntry(entry: EntryDTO) {
    setClipboard(entry);
    toast.success("Copied — click Paste on any cell");
  }

  function handlePasteEntry(targetWeek: WeekDTO, targetTimeslot: TimeslotDTO) {
    if (!clipboard) return;
    upsertEntry({
      weekId: targetWeek.id,
      timeslotId: targetTimeslot.id,
      title: clipboard.title,
      description: clipboard.description,
      phase: clipboard.phase,
      cohort: activeCohort,
    })
      .then(() => toast.success("Pasted"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"));
  }
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

            // Detect a month boundary — render a banner row above the first
            // week of each month (always, even if no theme is set, so the
            // coach can click to add one).
            const ymCurrent = yearMonthOf(week.saturday);
            const prev = wIdx > 0 ? weeks[wIdx - 1] : null;
            const isFirstOfMonth = !prev || yearMonthOf(prev.saturday) !== ymCurrent;
            const theme = themesByKey.get(ymCurrent) ?? null;

            return (
              <RowFragment key={week.id}>
                {/* Month banner — spans the entire grid row */}
                {isFirstOfMonth && (
                  <button
                    type="button"
                    onClick={
                      editable
                        ? () =>
                            setActiveMonth({
                              yearMonth: ymCurrent,
                              existing: theme,
                            })
                        : undefined
                    }
                    disabled={!editable}
                    style={{ gridColumn: `1 / -1` }}
                    className={cn(
                      "text-left px-3 py-2 border-b border-border bg-mute-4/70 flex flex-wrap items-baseline gap-x-3 gap-y-0.5",
                      editable && "hover:bg-mute-3/60 transition-colors cursor-pointer"
                    )}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-mute-1">
                      {format(sat, "MMMM yyyy")}
                    </span>
                    {theme ? (
                      <>
                        <span className="text-[13px] font-bold text-foreground">
                          {theme.title}
                        </span>
                        {theme.subtitle && (
                          <span className="text-[12px] text-mute-1">
                            · {theme.subtitle}
                          </span>
                        )}
                      </>
                    ) : (
                      editable && (
                        <span className="text-[12px] text-mute-2 italic">
                          Click to add a theme for this month
                        </span>
                      )
                    )}
                  </button>
                )}

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
                    const cellEntries = week.entries.filter(
                      (e) => e.timeslotId === t.id && e.cohort === activeCohort
                    );
                    return (
                      <Cell
                        key={t.id}
                        week={week}
                        timeslot={t}
                        entries={cellEntries}
                        editable={editable}
                        rowBorder={rowBorder}
                        onEdit={
                          editable
                            ? (entry) =>
                                setActiveCell({ week, timeslot: t, entry })
                            : undefined
                        }
                        onAdd={
                          editable
                            ? () =>
                                setActiveCell({ week, timeslot: t, entry: null })
                            : undefined
                        }
                        clipboard={clipboard}
                        onCopy={handleCopyEntry}
                        onPaste={
                          clipboard ? () => handlePasteEntry(week, t) : undefined
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
                    <WeekRowActions week={week} activeCohort={activeCohort} />
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

      {editable && activeMonth && (
        <MonthThemeDialog
          open={!!activeMonth}
          onOpenChange={(v) => !v && setActiveMonth(null)}
          yearMonth={activeMonth.yearMonth}
          cohort={activeCohort}
          existing={activeMonth.existing}
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

/**
 * A single (week × timeslot) cell. Holds zero or more stacked cards for the
 * active cohort. Editable cells are a drop target and expose add/paste
 * affordances; public cells just render the stack.
 */
function Cell({
  week,
  timeslot,
  entries,
  editable,
  rowBorder,
  onEdit,
  onAdd,
  clipboard,
  onCopy,
  onPaste,
}: {
  week: WeekDTO;
  timeslot: TimeslotDTO;
  entries: EntryDTO[];
  editable: boolean;
  rowBorder: string;
  onEdit?: (entry: EntryDTO) => void;
  onAdd?: () => void;
  clipboard?: EntryDTO | null;
  onCopy?: (entry: EntryDTO) => void;
  onPaste?: () => void;
}) {
  const dropId = `week:${week.id}|ts:${timeslot.id}`;

  if (!editable) {
    return (
      <div
        className={cn(
          "border-l border-border px-2 py-2 min-h-16 flex flex-col gap-1.5",
          rowBorder
        )}
      >
        {entries.map((e) => (
          <EntryCardStatic key={e.id} entry={e} />
        ))}
      </div>
    );
  }

  return (
    <DroppableCell
      id={dropId}
      rowBorder={rowBorder}
      entries={entries}
      onEdit={onEdit}
      onAdd={onAdd}
      onCopy={onCopy}
      canPaste={!!clipboard}
      onPaste={onPaste}
    />
  );
}

function DroppableCell({
  id,
  rowBorder,
  entries,
  onEdit,
  onAdd,
  onCopy,
  canPaste,
  onPaste,
}: {
  id: string;
  rowBorder: string;
  entries: EntryDTO[];
  onEdit?: (entry: EntryDTO) => void;
  onAdd?: () => void;
  onCopy?: (entry: EntryDTO) => void;
  canPaste?: boolean;
  onPaste?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const empty = entries.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative border-l border-border min-h-16 px-2 py-2 flex flex-col gap-1.5 group/cell",
        isOver && "bg-brand-bg ring-2 ring-brand-dim ring-inset",
        rowBorder
      )}
    >
      {entries.map((e) => (
        <DraggableEntryCard
          key={e.id}
          entry={e}
          onEdit={onEdit ? () => onEdit(e) : undefined}
          onCopy={onCopy ? () => onCopy(e) : undefined}
        />
      ))}

      {/* Footer: add + paste. Prominent when the cell is empty, otherwise
          revealed on hover so a full stack stays uncluttered. */}
      <div
        className={cn(
          "flex items-center gap-1.5 transition-opacity",
          empty
            ? "opacity-60 group-hover/cell:opacity-100"
            : "opacity-0 group-hover/cell:opacity-100"
        )}
      >
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md text-[11px] font-semibold text-mute-1 hover:bg-mute-4 hover:text-foreground transition-colors"
        >
          <Plus size={12} />
          {empty ? "Add lesson" : "Add"}
        </button>
        {canPaste && onPaste && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPaste();
            }}
            aria-label="Paste copied card here"
            className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md bg-brand text-ink border border-brand-dim text-[10.5px] font-bold uppercase tracking-[0.04em] hover:brightness-95"
          >
            <ClipboardPaste size={11} /> Paste
          </button>
        )}
      </div>
    </div>
  );
}

/** Editable card — draggable, click to edit, copy + delete on hover. */
function DraggableEntryCard({
  entry,
  onEdit,
  onCopy,
}: {
  entry: EntryDTO;
  onEdit?: () => void;
  onCopy?: () => void;
}) {
  const meta = PHASE_META[entry.phase];
  const drag = useDraggable({ id: entry.id });

  const style: React.CSSProperties = {
    background: meta.bg,
    borderColor: meta.border,
    transform: drag.transform
      ? `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`
      : undefined,
    opacity: drag.isDragging ? 0.4 : 1,
    zIndex: drag.isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={drag.setNodeRef}
      style={style}
      className="relative rounded-md border pl-3 pr-2 py-1.5 group/card overflow-hidden hover:brightness-[0.98]"
    >
      <span
        aria-hidden
        className="absolute left-0 inset-y-0 w-1 pointer-events-none"
        style={{ background: meta.ink }}
      />

      {/* Drag handle */}
      <button
        type="button"
        {...drag.listeners}
        {...drag.attributes}
        className="absolute top-1 left-1 z-20 size-4 rounded grid place-items-center text-mute-1 hover:text-foreground bg-card/80 border border-border opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Drag card"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={10} />
      </button>

      {/* Click-to-edit overlay */}
      <button
        type="button"
        onClick={onEdit}
        className="absolute inset-0 w-full h-full"
        aria-label="Edit card"
      />

      <span
        className="text-[9px] font-bold uppercase tracking-[0.06em] block relative pointer-events-none"
        style={{ color: meta.ink }}
      >
        {meta.label}
      </span>
      <div className="text-[12.5px] font-semibold text-foreground leading-tight mt-0.5 relative pointer-events-none">
        {entry.title}
      </div>
      {entry.description && (
        <div className="text-[11px] text-mute-1 mt-0.5 line-clamp-2 relative pointer-events-none">
          {entry.description}
        </div>
      )}

      {onCopy && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          aria-label="Copy card"
          className="absolute top-1 right-8 z-10 size-5 rounded-md bg-card/95 border border-border text-mute-1 hover:bg-mute-4 hover:text-foreground grid place-items-center opacity-0 group-hover/card:opacity-100 transition-opacity"
        >
          <Copy size={10} />
        </button>
      )}
      <CellQuickDelete entryId={entry.id} />
    </div>
  );
}

/** Read-only card for the public view. */
function EntryCardStatic({ entry }: { entry: EntryDTO }) {
  const meta = PHASE_META[entry.phase];
  return (
    <div
      className="relative rounded-md border pl-3 pr-2 py-1.5 overflow-hidden"
      style={{ background: meta.bg, borderColor: meta.border }}
    >
      <span
        aria-hidden
        className="absolute left-0 inset-y-0 w-1"
        style={{ background: meta.ink }}
      />
      <span
        className="text-[9px] font-bold uppercase tracking-[0.06em] block"
        style={{ color: meta.ink }}
      >
        {meta.label}
      </span>
      <div className="text-[12.5px] font-semibold text-foreground leading-tight mt-0.5">
        {entry.title}
      </div>
      {entry.description && (
        <div className="text-[11px] text-mute-1 mt-0.5 line-clamp-2">
          {entry.description}
        </div>
      )}
    </div>
  );
}

function CellQuickDelete({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Remove this card?")) return;
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
      aria-label="Delete card"
      className="absolute top-1 right-1 z-10 size-5 rounded-md bg-card/95 border border-border text-mute-1 hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center opacity-0 group-hover/card:opacity-100 transition-opacity"
    >
      {isPending ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <Trash2 size={10} />
      )}
    </button>
  );
}
