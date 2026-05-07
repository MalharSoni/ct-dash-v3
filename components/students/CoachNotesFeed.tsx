"use client";

import { useState, useTransition } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, Pin, PinOff, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  addCoachNote,
  deleteCoachNote,
  togglePinNote,
} from "@/app/students/[id]/notes/actions";

type Note = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  coach: { name: string };
};

interface Props {
  studentId: string;
  notes: Note[];
}

export function CoachNotesFeed({ studentId, notes }: Props) {
  const [body, setBody] = useState("");
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!body.trim()) {
      toast.error("Note can't be empty");
      return;
    }
    startTransition(async () => {
      try {
        await addCoachNote({
          studentId,
          body: body.trim(),
          pinned: false,
        });
        toast.success("Note added");
        setBody("");
        setAdding(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    startTransition(async () => {
      try {
        await deleteCoachNote(id, studentId);
        toast.success("Deleted");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handlePin(id: string) {
    startTransition(async () => {
      try {
        await togglePinNote(id, studentId);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">
          Coach notes{" "}
          <span className="text-mute-1 font-normal">({notes.length})</span>
        </h3>
        {!adding && (
          <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> Add note
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2">
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Quick observation, parent message, follow-up reminder…"
            autoFocus
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setBody("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Save
            </Button>
          </div>
          <p className="text-[10.5px] text-mute-2">⌘+Enter to save</p>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10.5px] uppercase tracking-[0.06em] font-bold text-brand-dim flex items-center gap-1">
                <Pin size={10} /> Pinned
              </div>
              {pinned.map((n) => (
                <NoteItem
                  key={n.id}
                  note={n}
                  onPin={() => handlePin(n.id)}
                  onDelete={() => handleDelete(n.id)}
                  isPending={isPending}
                />
              ))}
            </div>
          )}
          {rest.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              onPin={() => handlePin(n.id)}
              onDelete={() => handleDelete(n.id)}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NoteItem({
  note,
  onPin,
  onDelete,
  isPending,
}: {
  note: Note;
  onPin: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const created = new Date(note.createdAt);
  return (
    <div className="border-l-2 border-border pl-3 py-1 group">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.05em] text-mute-1 font-bold">
          <span>{note.coach.name}</span>
          <span>·</span>
          <span title={format(created, "PPpp")}>
            {formatDistanceToNow(created, { addSuffix: true })}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onPin}
            disabled={isPending}
            className="size-6 rounded-md text-mute-1 hover:bg-mute-4 hover:text-foreground grid place-items-center"
            title={note.pinned ? "Unpin" : "Pin"}
          >
            {note.pinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="size-6 rounded-md text-mute-1 hover:bg-mute-4 hover:text-destructive grid place-items-center"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <p className="text-[13px] text-foreground whitespace-pre-wrap mt-0.5">
        {note.body}
      </p>
    </div>
  );
}
