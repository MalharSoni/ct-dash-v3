"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createStudent, updateStudent } from "@/app/students/actions";
import type { StudentTrack } from "@prisma/client";

const TRACKS: { value: StudentTrack; label: string }[] = [
  { value: "FOUNDATION", label: "Foundation" },
  { value: "PROJECTS", label: "Projects" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "INACTIVE", label: "Inactive" },
];

type Initial = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  parentPhone?: string | null;
  grade?: number | null;
  gradYear?: number | null;
  track?: StudentTrack;
  notes?: string | null;
};

interface Props {
  initial?: Initial;
  defaultTrack?: StudentTrack;
}

export function StudentForm({ initial, defaultTrack = "FOUNDATION" }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [parentName, setParentName] = useState(initial?.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initial?.parentEmail ?? "");
  const [parentPhone, setParentPhone] = useState(initial?.parentPhone ?? "");
  const [grade, setGrade] = useState(initial?.grade?.toString() ?? "");
  const [gradYear, setGradYear] = useState(initial?.gradYear?.toString() ?? "");
  const [track, setTrack] = useState<StudentTrack>(initial?.track ?? defaultTrack);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First and last name required");
      return;
    }
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      parentName: parentName.trim() || null,
      parentEmail: parentEmail.trim() || null,
      parentPhone: parentPhone.trim() || null,
      grade: grade ? Number(grade) : null,
      gradYear: gradYear ? Number(gradYear) : null,
      track,
      notes: notes.trim() || null,
    };

    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateStudent(initial.id, payload);
          toast.success("Student updated");
        } else {
          await createStudent(payload);
          // createStudent redirects on success; toast handled there
        }
      } catch (e: unknown) {
        // Redirect throws a NEXT_REDIRECT error — let it through.
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <FormSection
        title="Identity"
        description="Required to add a student."
      >
        <Field label="First name" required>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Last name" required>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
        <Field label="Track">
          <Select
            value={track}
            onValueChange={(v) => setTrack(v as StudentTrack)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACKS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grade (1–13)">
            <Input
              type="number"
              min={1}
              max={13}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Grad year">
            <Input
              type="number"
              min={2024}
              max={2040}
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="—"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Contact" description="Optional. Used for outreach.">
        <Field label="Student email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
          />
        </Field>
        <Field label="Student phone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(416) 555-0000"
          />
        </Field>
      </FormSection>

      <FormSection title="Parent / Guardian">
        <Field label="Parent name">
          <Input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Parent email">
            <Input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </Field>
          <Field label="Parent phone">
            <Input
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <Field>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything important the next coach should know."
          />
        </Field>
      </FormSection>

      <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-3 border-t border-border">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Create student"}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-x-6 gap-y-3">
      <div>
        <h3 className="text-section-header">{title}</h3>
        {description && (
          <p className="text-[12px] text-mute-1 mt-0.5">{description}</p>
        )}
      </div>
      <div className="space-y-3 bg-card border border-border rounded-[var(--radius)] p-4 shadow-card">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
    </div>
  );
}
