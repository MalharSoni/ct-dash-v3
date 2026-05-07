"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  GraduationCap,
  Sparkles,
  FolderKanban,
  Trophy,
  CalendarRange,
  Settings,
  Search,
  Plus,
  ExternalLink,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, hint: "G H" },
  { href: "/attendance", label: "Attendance", icon: ClipboardCheck, hint: "G A" },
  { href: "/students", label: "Students", icon: Users, hint: "G S" },
  { href: "/foundation", label: "Foundation", icon: GraduationCap, hint: "G F" },
  {
    href: "/trial-students",
    label: "Trial Students",
    icon: Sparkles,
    hint: "G T",
  },
  { href: "/projects", label: "Projects", icon: FolderKanban, hint: "G P" },
  { href: "/teams", label: "Teams", icon: Trophy, hint: "G E" },
  { href: "/curriculum", label: "Curriculum", icon: CalendarRange, hint: "G C" },
  { href: "/settings", label: "Settings", icon: Settings, hint: "G ," },
];

const ACTIONS = [
  {
    href: "/students/new",
    label: "Add new student",
    icon: Plus,
  },
  {
    href: "/students/new?track=FOUNDATION",
    label: "Add foundation student",
    icon: Plus,
  },
  {
    href: "/trial-students/new",
    label: "Schedule trial",
    icon: Plus,
  },
  {
    href: "/projects/new",
    label: "New project",
    icon: Plus,
  },
  {
    href: "/teams/new",
    label: "New team",
    icon: Plus,
  },
  {
    href: "/c",
    label: "Open public curriculum link",
    icon: ExternalLink,
    target: "_blank",
  },
];

interface SearchHit {
  id: string;
  label: string;
  sub?: string;
  href: string;
}

export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-mute-1"
        onClick={() => setOpen(true)}
      >
        <Search size={15} />
        <span className="hidden md:inline">Search</span>
        <kbd className="hidden md:inline ml-1.5 px-1.5 py-0.5 bg-mute-4 border border-border rounded-[4px] text-[10px] font-mono">
          ⌘K
        </kbd>
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<SearchHit[]>([]);

  // Search students as you type (debounced).
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setStudents([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { cache: "no-store" }
        );
        const data = await res.json();
        setStudents(data.students ?? []);
      } catch {
        // ignore
      }
    }, 200);
    return () => clearTimeout(id);
  }, [query, open]);

  function go(href: string, target?: string) {
    onOpenChange(false);
    if (target === "_blank") window.open(href, "_blank");
    else router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type to search or navigate…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>

        {students.length > 0 && (
          <>
            <CommandGroup heading="Students">
              {students.map((s) => (
                <CommandItem
                  key={s.id}
                  value={`student-${s.label}`}
                  onSelect={() => go(s.href)}
                >
                  <Users size={13} />
                  {s.label}
                  {s.sub && (
                    <span className="text-mute-1 text-[11px] ml-2">{s.sub}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Navigate">
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            return (
              <CommandItem
                key={n.href}
                value={`go-${n.label}`}
                onSelect={() => go(n.href)}
              >
                <Icon size={13} />
                {n.label}
                <CommandShortcut>{n.hint}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <CommandItem
                key={a.href}
                value={`action-${a.label}`}
                onSelect={() => go(a.href, a.target)}
              >
                <Icon size={13} />
                {a.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
