"use client";

import { useTransition } from "react";
import { Check, ChevronDown, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { setActiveCoach } from "@/app/settings/coach-actions";
import Link from "next/link";

interface Props {
  activeCoachId: string;
  coaches: { id: string; name: string }[];
}

export function CoachSwitcher({ activeCoachId, coaches }: Props) {
  const active = coaches.find((c) => c.id === activeCoachId);
  const [isPending, startTransition] = useTransition();

  function pick(id: string) {
    if (id === activeCoachId) return;
    startTransition(async () => {
      try {
        await setActiveCoach(id);
        const c = coaches.find((x) => x.id === id);
        toast.success(`Now driving as ${c?.name}`);
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  if (!active) return null;
  const [first, last = ""] = active.name.split(/\s+/);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2" disabled={isPending}>
          <AvatarInitials firstName={first} lastName={last} size={22} />
          <span className="hidden sm:inline text-[12.5px] font-semibold">
            {active.name.split(/\s+/)[0]}
          </span>
          {isPending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : (
            <ChevronDown size={11} className="text-mute-1" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <UserCog size={12} /> Driving as
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {coaches.map((c) => {
          const [f, l = ""] = c.name.split(/\s+/);
          const me = c.id === activeCoachId;
          return (
            <DropdownMenuItem
              key={c.id}
              onSelect={() => pick(c.id)}
              className="gap-2"
            >
              <AvatarInitials firstName={f} lastName={l} size={22} />
              <span className="flex-1">{c.name}</span>
              {me && <Check size={12} className="text-success" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="text-[12px] text-mute-1">
            Manage coaches…
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
