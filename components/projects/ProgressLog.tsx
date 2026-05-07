"use client";

import { useState, useTransition } from "react";
import { format, startOfWeek } from "date-fns";
import { Plus, Trash2, Loader2, User } from "lucide-react";
import { toast } from "sonner";
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
import { logProgress, deleteProgress } from "@/app/projects/actions";

type Entry = {
  id: string;
  weekOf: string;
  notes: string;
  blockers: string | null;
  loggedBy: { name: string };
  student?: { firstName: string; lastName: string } | null;
};

type Member = {
  studentId: string;
  student: { firstName: string; lastName: string };
};

interface Props {
  projectId: string;
  entries: Entry[];
  members?: Member[];
}

export function ProgressLog({ projectId, entries, members = [] }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [weekOf, setWeekOf] = useState(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    return format(monday, "yyyy-MM-dd");
  });
  const [notes, setNotes] = useState("");
  const [blockers, setBlockers] = useState("");
  const [studentId, setStudentId] = useState<string>("__team__");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!notes.trim()) {
      toast.error("Notes required");
      return;
    }
    startTransition(async () => {
      try {
        await logProgress({
          projectId,
          weekOf,
          notes: notes.trim(),
          blockers: blockers.trim() || null,
          studentId: studentId === "__team__" ? null : studentId,
        });
        toast.success("Logged");
        setNotes("");
        setBlockers("");
        setStudentId("__team__");
        setShowForm(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      try {
        await deleteProgress(id, projectId);
        toast.success("Removed");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">Weekly progress</h3>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Log
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-[var(--radius-sm)] p-3 space-y-2 bg-mute-4/30">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Week of</Label>
              <Input
                type="date"
                value={weekOf}
                onChange={(e) => setWeekOf(e.target.value)}
              />
            </div>
            {members.length > 0 && (
              <div className="space-y-1">
                <Label className="text-[11px]">Specific student (optional)</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__team__">Team-wide</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.studentId} value={m.studentId}>
                        {m.student.firstName} {m.student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Notes *</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was accomplished this week?"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">Blockers (optional)</Label>
            <Textarea
              rows={2}
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="What's in the way?"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Log
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">
          No weekly progress yet. Log your first entry.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li
              key={e.id}
              className="border-l-2 border-brand pl-3 py-1 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-mute-1 flex items-center gap-1.5 flex-wrap">
                  <span>Week of {format(new Date(e.weekOf), "MMM d, yyyy")}</span>
                  <span>·</span>
                  <span>{e.loggedBy.name}</span>
                  {e.student && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <User size={10} />
                        {e.student.firstName} {e.student.lastName}
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(e.id)}
                  disabled={isPending}
                  className="text-mute-2 hover:text-destructive"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-[13px] whitespace-pre-wrap">{e.notes}</p>
              {e.blockers && (
                <p className="text-[12px] text-destructive">
                  Blocker: {e.blockers}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
