"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { addMember, removeMember } from "@/app/projects/actions";

type Member = {
  id: string;
  studentId: string;
  role: string | null;
  student: { firstName: string; lastName: string };
};
type Candidate = { id: string; firstName: string; lastName: string };

interface Props {
  projectId: string;
  members: Member[];
  candidates: Candidate[];
}

export function MemberManager({ projectId, members, candidates }: Props) {
  const [pickStudent, setPickStudent] = useState("");
  const [role, setRole] = useState("");
  const [isPending, startTransition] = useTransition();

  const memberStudentIds = new Set(members.map((m) => m.studentId));
  const available = candidates.filter((c) => !memberStudentIds.has(c.id));

  function handleAdd() {
    if (!pickStudent) {
      toast.error("Pick a student first");
      return;
    }
    startTransition(async () => {
      try {
        await addMember(projectId, pickStudent, role.trim() || undefined);
        toast.success("Added");
        setPickStudent("");
        setRole("");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleRemove(studentId: string) {
    if (!confirm("Remove from project?")) return;
    startTransition(async () => {
      try {
        await removeMember(projectId, studentId);
        toast.success("Removed");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      {members.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-mute-4/40 border border-border rounded-[var(--radius-sm)]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AvatarInitials
                  firstName={m.student.firstName}
                  lastName={m.student.lastName}
                  size={26}
                />
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate">
                    {m.student.firstName} {m.student.lastName}
                  </div>
                  {m.role && (
                    <div className="text-[11px] text-mute-1 truncate">{m.role}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(m.studentId)}
                disabled={isPending}
                className="size-7 rounded-md text-mute-1 hover:bg-card hover:text-destructive transition-colors grid place-items-center"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {available.length > 0 && (
        <div className="border-t border-border pt-3 space-y-2">
          <div className="grid grid-cols-[1fr_140px_auto] gap-2">
            <Select value={pickStudent} onValueChange={setPickStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Add a student…" />
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (opt)"
            />
            <Button size="sm" onClick={handleAdd} disabled={isPending}>
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
