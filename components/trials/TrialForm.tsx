"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrial, updateTrial } from "@/app/trial-students/actions";

type Initial = {
  id?: string;
  firstName?: string;
  lastName?: string;
  parentName?: string | null;
  parentEmail?: string | null;
  parentPhone?: string | null;
  grade?: number | null;
  scheduledAt?: Date;
  timeslot?: string;
  notes?: string | null;
};

interface Props {
  initial?: Initial;
}

function toLocalInput(d?: Date) {
  if (!d) return "";
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function TrialForm({ initial }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [parentName, setParentName] = useState(initial?.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initial?.parentEmail ?? "");
  const [parentPhone, setParentPhone] = useState(initial?.parentPhone ?? "");
  const [grade, setGrade] = useState(initial?.grade?.toString() ?? "");
  const [scheduledAt, setScheduledAt] = useState(toLocalInput(initial?.scheduledAt));
  const [timeslot, setTimeslot] = useState(initial?.timeslot ?? "Morning 1");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !scheduledAt || !timeslot) {
      toast.error("Name, date/time, and timeslot are required");
      return;
    }
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      parentName: parentName.trim() || null,
      parentEmail: parentEmail.trim() || null,
      parentPhone: parentPhone.trim() || null,
      grade: grade ? Number(grade) : null,
      scheduledAt,
      timeslot: timeslot.trim(),
      notes: notes.trim() || null,
    };
    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateTrial(initial.id, payload);
          toast.success("Trial updated");
        } else {
          await createTrial(payload);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Student</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First name *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Last name *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Grade</Label>
          <Input type="number" min={1} max={13} value={grade} onChange={(e) => setGrade(e.target.value)} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Schedule</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date & time *</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Timeslot label *</Label>
            <Input
              value={timeslot}
              onChange={(e) => setTimeslot(e.target.value)}
              placeholder="Morning 1"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Parent / Guardian</h3>
        <div className="space-y-1.5">
          <Label>Parent name</Label>
          <Input value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Parent email</Label>
            <Input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Parent phone</Label>
            <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card">
        <h3 className="text-section-header mb-3">Notes</h3>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember about this trial."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Schedule trial"}
        </Button>
      </div>
    </form>
  );
}
