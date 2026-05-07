"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  MapPin,
  Clock,
  Wrench,
  Trophy,
  Users2,
  Hammer,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createEvent, updateEvent, deleteEvent } from "@/app/teams/actions";
import { cn } from "@/lib/utils";
import type { TeamEventType } from "@prisma/client";

type Event = {
  id: string;
  type: TeamEventType;
  title: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  notes: string | null;
};

const TYPES: { value: TeamEventType; label: string; icon: typeof Wrench; cls: string }[] = [
  { value: "PRACTICE", label: "Practice", icon: Wrench, cls: "text-blue-700 bg-blue-50 border-blue-200" },
  { value: "SCRIMMAGE", label: "Scrimmage", icon: Users2, cls: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "COMPETITION", label: "Competition", icon: Trophy, cls: "text-red-700 bg-red-50 border-red-200" },
  { value: "BUILD_DAY", label: "Build day", icon: Hammer, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "MEETING", label: "Meeting", icon: Clock, cls: "text-mute-1 bg-mute-4 border-mute-3" },
  { value: "OTHER", label: "Other", icon: HelpCircle, cls: "text-mute-1 bg-mute-4 border-mute-3" },
];

const META = Object.fromEntries(TYPES.map((t) => [t.value, t]));

interface Props {
  teamId: string;
  events: Event[];
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function EventTimeline({ teamId, events }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(ev: Event) {
    setEditing(ev);
    setOpen(true);
  }

  // Split into upcoming + past
  const now = Date.now();
  const upcoming = events.filter((e) => new Date(e.startAt).getTime() >= now);
  const past = events.filter((e) => new Date(e.startAt).getTime() < now);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">Schedule</h3>
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus size={13} /> New event
        </Button>
      </div>

      {events.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">
          No events yet. Add practices, scrimmages, build days, and competitions.
        </p>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <Section title={`Upcoming (${upcoming.length})`}>
              {upcoming
                .sort(
                  (a, b) =>
                    new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
                )
                .map((e) => (
                  <Row key={e.id} event={e} onEdit={() => openEdit(e)} />
                ))}
            </Section>
          )}
          {past.length > 0 && (
            <Section title={`Past (${past.length})`}>
              {past
                .sort(
                  (a, b) =>
                    new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
                )
                .slice(0, 8)
                .map((e) => (
                  <Row key={e.id} event={e} onEdit={() => openEdit(e)} faded />
                ))}
            </Section>
          )}
        </div>
      )}

      <EventDialog
        teamId={teamId}
        event={editing}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
        {title}
      </div>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function Row({
  event,
  onEdit,
  faded,
}: {
  event: Event;
  onEdit: () => void;
  faded?: boolean;
}) {
  const m = META[event.type];
  const Icon = m.icon;
  const start = new Date(event.startAt);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this event?")) return;
    startTransition(async () => {
      try {
        await deleteEvent(event.id);
        toast.success("Removed");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2 border border-border rounded-[var(--radius-sm)] bg-card group",
        faded && "opacity-60"
      )}
    >
      <div
        className={cn(
          "size-8 rounded-md grid place-items-center border",
          m.cls
        )}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold truncate">{event.title}</span>
          <span
            className={cn(
              "text-[9.5px] font-bold uppercase tracking-[0.05em] px-1 py-0.5 rounded border",
              m.cls
            )}
          >
            {m.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-mute-1 font-mono mt-0.5">
          <span>{format(start, "EEE, MMM d · HH:mm")}</span>
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} /> {event.location}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="size-7 rounded-md text-mute-1 hover:bg-mute-3 hover:text-foreground grid place-items-center"
          title="Edit"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="size-7 rounded-md text-mute-1 hover:bg-mute-3 hover:text-destructive grid place-items-center"
          title="Delete"
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </div>
    </li>
  );
}

function EventDialog({
  teamId,
  event,
  open,
  onOpenChange,
}: {
  teamId: string;
  event: Event | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [type, setType] = useState<TeamEventType>(event?.type ?? "PRACTICE");
  const [title, setTitle] = useState(event?.title ?? "");
  const [startAt, setStartAt] = useState(toLocalInput(event?.startAt));
  const [endAt, setEndAt] = useState(toLocalInput(event?.endAt));
  const [location, setLocation] = useState(event?.location ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  // Sync state when event changes
  function reset() {
    setType(event?.type ?? "PRACTICE");
    setTitle(event?.title ?? "");
    setStartAt(toLocalInput(event?.startAt));
    setEndAt(toLocalInput(event?.endAt));
    setLocation(event?.location ?? "");
    setNotes(event?.notes ?? "");
  }

  function handleOpenChange(v: boolean) {
    if (v) reset();
    onOpenChange(v);
  }

  function handleSave() {
    if (!title.trim() || !startAt) {
      toast.error("Title and start time required");
      return;
    }
    const payload = {
      type,
      title: title.trim(),
      startAt,
      endAt: endAt || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      try {
        if (event) {
          await updateEvent(event.id, payload);
          toast.success("Event updated");
        } else {
          await createEvent({ teamId, ...payload });
          toast.success("Event added");
        }
        onOpenChange(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TeamEventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Provincials"
                autoFocus
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End (optional)</Label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {event ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
