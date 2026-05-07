"use client";

import { useState, useTransition } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addTeamMember,
  setMemberRole,
  removeTeamMember,
} from "@/app/teams/actions";
import type { TeamRole } from "@prisma/client";

const ROLES: { value: TeamRole; label: string }[] = [
  { value: "CAPTAIN", label: "Captain" },
  { value: "DRIVER", label: "Driver" },
  { value: "PROGRAMMER", label: "Programmer" },
  { value: "BUILDER", label: "Builder" },
  { value: "STRATEGIST", label: "Strategist" },
  { value: "NOTEBOOK", label: "Notebook" },
  { value: "MEMBER", label: "Member" },
];

type Member = {
  id: string;
  studentId: string;
  role: TeamRole;
  student: { firstName: string; lastName: string };
};
type Candidate = { id: string; firstName: string; lastName: string };

interface Props {
  teamId: string;
  members: Member[];
  candidates: Candidate[];
}

export function TeamMemberList({ teamId, members, candidates }: Props) {
  const [pickStudent, setPickStudent] = useState("");
  const [pickRole, setPickRole] = useState<TeamRole>("MEMBER");
  const [isPending, startTransition] = useTransition();

  const taken = new Set(members.map((m) => m.studentId));
  const available = candidates.filter((c) => !taken.has(c.id));

  function handleAdd() {
    if (!pickStudent) {
      toast.error("Pick a student");
      return;
    }
    startTransition(async () => {
      try {
        await addTeamMember({ teamId, studentId: pickStudent, role: pickRole });
        toast.success("Added");
        setPickStudent("");
        setPickRole("MEMBER");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function changeRole(memberId: string, role: TeamRole) {
    startTransition(async () => {
      try {
        await setMemberRole(memberId, role);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function remove(memberId: string) {
    if (!confirm("Remove from team?")) return;
    startTransition(async () => {
      try {
        await removeTeamMember(memberId);
        toast.success("Removed");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      {available.length > 0 && (
        <div className="space-y-2">
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
          <div className="flex gap-2">
            <Select value={pickRole} onValueChange={(v) => setPickRole(v as TeamRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={isPending} className="shrink-0">
              {isPending ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add
            </Button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <p className="text-[12.5px] text-mute-1">No members yet.</p>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 px-3 py-2 bg-mute-4/40 border border-border rounded-[var(--radius-sm)]"
            >
              <AvatarInitials
                firstName={m.student.firstName}
                lastName={m.student.lastName}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold truncate">
                  {m.student.firstName} {m.student.lastName}
                </div>
              </div>
              <Select value={m.role} onValueChange={(v) => changeRole(m.id, v as TeamRole)}>
                <SelectTrigger className="w-[110px] h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => remove(m.id)}
                disabled={isPending}
                className="size-7 shrink-0 rounded-md text-mute-1 hover:bg-card hover:text-destructive transition-colors grid place-items-center"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
