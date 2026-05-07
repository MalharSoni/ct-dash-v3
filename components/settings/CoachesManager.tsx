"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, UserCheck, UserX, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import {
  createCoach,
  deactivateCoach,
  reactivateCoach,
} from "@/app/settings/actions";
import { updateCoach } from "@/app/settings/coach-actions";
import { cn } from "@/lib/utils";

type Coach = {
  id: string;
  name: string;
  email: string | null;
  active: boolean;
};

interface Props {
  coaches: Coach[];
}

export function CoachesManager({ coaches }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      try {
        await createCoach({ name: name.trim(), email: email.trim() || null });
        toast.success("Coach added");
        setName("");
        setEmail("");
        setShowForm(false);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function startEdit(c: Coach) {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setEmail("");
  }

  function saveEdit(id: string) {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    startTransition(async () => {
      try {
        await updateCoach(id, {
          name: name.trim(),
          email: email.trim() || null,
        });
        toast.success("Coach updated");
        cancelEdit();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function toggleActive(c: Coach) {
    startTransition(async () => {
      try {
        if (c.active) await deactivateCoach(c.id);
        else await reactivateCoach(c.id);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-section-header">Coaches</h3>
          <p className="text-[12px] text-mute-1">
            Coach records are used to attribute attendance, notes, and assessments.
          </p>
        </div>
        {!showForm && !editingId && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus size={13} /> Add coach
          </Button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2">
          <CoachFormFields
            name={name}
            setName={setName}
            email={email}
            setEmail={setEmail}
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
        {coaches.map((c) => {
          if (editingId === c.id) {
            return (
              <li
                key={c.id}
                className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2"
              >
                <CoachFormFields
                  name={name}
                  setName={setName}
                  email={email}
                  setEmail={setEmail}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X size={13} /> Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveEdit(c.id)} disabled={isPending}>
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

          const [first, last = ""] = c.name.split(/\s+/);
          return (
            <li
              key={c.id}
              className={cn(
                "flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--radius-sm)] border bg-card",
                !c.active && "opacity-60 border-dashed"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AvatarInitials firstName={first} lastName={last} size={28} />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">{c.name}</div>
                  {c.email && (
                    <div className="text-[11px] text-mute-1 truncate">{c.email}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  disabled={isPending}
                  className="size-8 rounded-md text-mute-1 hover:bg-mute-3 hover:text-foreground transition-colors grid place-items-center"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(c)}
                  disabled={isPending}
                >
                  {c.active ? (
                    <>
                      <UserX size={13} /> Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck size={13} /> Reactivate
                    </>
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CoachFormFields({
  name,
  setName,
  email,
  setEmail,
}: {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-[11px]">Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-1">
        <Label className="text-[11px]">Email (optional)</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
    </>
  );
}
