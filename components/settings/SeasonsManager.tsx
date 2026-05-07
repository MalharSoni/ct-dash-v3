"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Plus, CheckCircle2, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createSeason,
  setCurrentSeason,
  deleteSeason,
} from "@/app/settings/actions";
import { updateSeason } from "@/app/settings/coach-actions";
import { cn } from "@/lib/utils";

type Season = {
  id: string;
  name: string;
  current: boolean;
  startDate: Date;
  endDate: Date | null;
};

interface Props {
  seasons: Season[];
}

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function SeasonsManager({ seasons }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim() || !startDate) {
      toast.error("Name and start date required");
      return;
    }
    startTransition(async () => {
      try {
        await createSeason({ name: name.trim(), startDate, endDate: endDate || null });
        toast.success("Season added");
        setName("");
        setStartDate("");
        setEndDate("");
        setShowForm(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function startEdit(s: Season) {
    setEditingId(s.id);
    setName(s.name);
    setStartDate(toDateInput(s.startDate));
    setEndDate(toDateInput(s.endDate));
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setStartDate("");
    setEndDate("");
  }

  function saveEdit(id: string) {
    if (!name.trim() || !startDate) {
      toast.error("Name and start date required");
      return;
    }
    startTransition(async () => {
      try {
        await updateSeason(id, {
          name: name.trim(),
          startDate,
          endDate: endDate || null,
        });
        toast.success("Season updated");
        cancelEdit();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function makeCurrent(id: string) {
    startTransition(async () => {
      try {
        await setCurrentSeason(id);
        toast.success("Set as current");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this season? Teams in it will be orphaned.")) return;
    startTransition(async () => {
      try {
        await deleteSeason(id);
        toast.success("Season deleted");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-section-header">Seasons</h3>
          <p className="text-[12px] text-mute-1">
            The current season is used when you create a new team.
          </p>
        </div>
        {!showForm && !editingId && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Add season
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2">
          <SeasonFormFields
            name={name}
            setName={setName}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Add
            </Button>
          </div>
        </div>
      )}

      {seasons.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">No seasons yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {seasons.map((s) => {
            if (editingId === s.id) {
              return (
                <li
                  key={s.id}
                  className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2"
                >
                  <SeasonFormFields
                    name={name}
                    setName={setName}
                    startDate={startDate}
                    setStartDate={setStartDate}
                    endDate={endDate}
                    setEndDate={setEndDate}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X size={13} /> Cancel
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(s.id)} disabled={isPending}>
                      {isPending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      Save
                    </Button>
                  </div>
                </li>
              );
            }
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] border",
                  s.current
                    ? "border-brand-dim/40 bg-brand-bg"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {s.current && <CheckCircle2 size={13} className="text-brand-dim shrink-0" />}
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{s.name}</div>
                    <div className="text-[11px] text-mute-1 font-mono">
                      {format(s.startDate, "MMM d, yyyy")}
                      {s.endDate && ` → ${format(s.endDate, "MMM d, yyyy")}`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!s.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => makeCurrent(s.id)}
                      disabled={isPending}
                    >
                      Set current
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    disabled={isPending}
                    className="size-8 rounded-md text-mute-1 hover:bg-mute-3 hover:text-foreground transition-colors grid place-items-center"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    disabled={isPending}
                    className="size-8 rounded-md text-mute-1 hover:bg-mute-3 hover:text-destructive transition-colors grid place-items-center"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SeasonFormFields({
  name,
  setName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: {
  name: string;
  setName: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-[11px]">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push Back 2025-26"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">Start</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">End (optional)</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
