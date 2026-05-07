"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
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
import { createProject, updateProject } from "@/app/projects/actions";
import type { ProjectStatus } from "@prisma/client";

type Initial = {
  id?: string;
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date | null;
};

function toDateInput(d?: Date | null) {
  if (!d) return "";
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function ProjectForm({ initial }: { initial?: Initial }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "PLANNING");
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate) || toDateInput(new Date()));
  const [endDate, setEndDate] = useState(toDateInput(initial?.endDate));
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate) {
      toast.error("Name and start date required");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      startDate,
      endDate: endDate || null,
    };
    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateProject(initial.id, payload);
          toast.success("Project updated");
        } else {
          await createProject(payload);
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
        <div className="space-y-1.5">
          <Label>Project name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is the goal of this project?"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNING">Planning</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start date *</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
