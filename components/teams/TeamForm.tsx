"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTeam, updateTeam } from "@/app/teams/actions";

type Initial = {
  id?: string;
  name?: string;
  teamNumber?: string;
  description?: string | null;
};

export function TeamForm({ initial }: { initial?: Initial }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [teamNumber, setTeamNumber] = useState(initial?.teamNumber ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !teamNumber.trim()) {
      toast.error("Name and number required");
      return;
    }
    const payload = {
      name: name.trim(),
      teamNumber: teamNumber.trim(),
      description: description.trim() || null,
    };
    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateTeam(initial.id, payload);
          toast.success("Team updated");
        } else {
          await createTeam(payload);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <div className="grid grid-cols-[1fr_140px] gap-3">
          <div className="space-y-1.5">
            <Label>Team name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Number *</Label>
            <Input
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              placeholder="839Z"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mission or focus."
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Create team"}
        </Button>
      </div>
    </form>
  );
}
