"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTimeslot,
  deleteTimeslot,
} from "@/app/settings/coach-actions";
import { renameTimeslot } from "@/app/curriculum/actions";

type Timeslot = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
};

interface Props {
  timeslots: Timeslot[];
}

export function TimeslotsManager({ timeslots }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) return toast.error("Name required");
    startTransition(async () => {
      try {
        await createTimeslot({ name: name.trim(), startTime, endTime });
        toast.success("Column added");
        setName("");
        setStartTime("09:00");
        setEndTime("11:00");
        setShowForm(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function startEdit(t: Timeslot) {
    setEditingId(t.id);
    setName(t.name);
    setStartTime(t.startTime);
    setEndTime(t.endTime);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setStartTime("09:00");
    setEndTime("11:00");
  }

  function saveEdit(id: string) {
    if (!name.trim()) return toast.error("Name required");
    startTransition(async () => {
      try {
        await renameTimeslot({ id, name: name.trim(), startTime, endTime });
        toast.success("Column updated");
        cancelEdit();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete(t: Timeslot) {
    if (
      !confirm(
        `Delete column "${t.name}"? All curriculum lessons in this column will also be removed.`
      )
    )
      return;
    startTransition(async () => {
      try {
        await deleteTimeslot(t.id);
        toast.success("Column deleted");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-section-header">Curriculum timeslots</h3>
          <p className="text-[12px] text-mute-1">
            Each timeslot is a column on the curriculum matrix.
          </p>
        </div>
        {!showForm && !editingId && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Add column
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2">
          <Fields
            name={name}
            setName={setName}
            startTime={startTime}
            setStartTime={setStartTime}
            endTime={endTime}
            setEndTime={setEndTime}
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

      <ul className="space-y-1.5">
        {timeslots.map((t) => {
          if (editingId === t.id) {
            return (
              <li
                key={t.id}
                className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2"
              >
                <Fields
                  name={name}
                  setName={setName}
                  startTime={startTime}
                  setStartTime={setStartTime}
                  endTime={endTime}
                  setEndTime={setEndTime}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X size={13} /> Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveEdit(t.id)} disabled={isPending}>
                    {isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    Save
                  </Button>
                </div>
              </li>
            );
          }
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] border border-border bg-card"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate">{t.name}</div>
                <div className="text-[11px] text-mute-1 font-mono">
                  {t.startTime}–{t.endTime}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  disabled={isPending}
                  className="size-8 rounded-md text-mute-1 hover:bg-mute-3 hover:text-foreground transition-colors grid place-items-center"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
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
    </div>
  );
}

function Fields({
  name,
  setName,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}: {
  name: string;
  setName: (v: string) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-[11px]">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">Start</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">End</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
