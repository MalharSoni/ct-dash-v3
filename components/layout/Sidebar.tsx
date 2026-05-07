"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Sparkles,
  FolderKanban,
  Trophy,
  CalendarRange,
  Settings,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "General",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/attendance", label: "Attendance", icon: ClipboardCheck },
      { href: "/students", label: "Students", icon: Users },
      { href: "/foundation", label: "Foundation", icon: GraduationCap },
      { href: "/trial-students", label: "Trial Students", icon: Sparkles },
    ],
  },
  {
    label: "Build",
    items: [
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/teams", label: "Teams", icon: Trophy },
      { href: "/curriculum", label: "Curriculum", icon: CalendarRange },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 h-[var(--topbar-height)] flex items-center border-b border-sidebar-border">
        <Link href="/" className="flex items-center">
          <Image
            src="/logos/ctrc-white.png"
            alt="Caution Tape Robotics"
            width={643}
            height={168}
            priority
            className="h-7 w-auto"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-mute-1">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && (
                        <span
                          className={cn(
                            "min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold grid place-items-center",
                            active
                              ? "bg-ink text-brand"
                              : "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border flex items-center gap-2.5">
        <div className="size-8 rounded-full bg-brand grid place-items-center text-ink font-bold text-[11px]">
          MS
        </div>
        <div className="leading-tight">
          <div className="text-[12.5px] font-semibold text-sidebar-accent-foreground">
            Malhar Soni
          </div>
          <div className="text-[10.5px] text-sidebar-foreground">Head Coach</div>
        </div>
      </div>
    </div>
  );
}
