"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  students: "Students",
  foundation: "Foundation",
  "trial-students": "Trial Students",
  attendance: "Attendance",
  projects: "Projects",
  teams: "Teams",
  curriculum: "Curriculum",
  settings: "Settings",
  reports: "Reports",
  new: "New",
  edit: "Edit",
  print: "Print",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segs = pathname.split("/").filter(Boolean);

  if (segs.length === 0) return null;

  // Don't show on the public /c page
  if (segs[0] === "c") return null;

  // Top-level pages: title in the topbar already says where you are.
  // Only render breadcrumbs once you're at least one level deep.
  if (segs.length < 2) return null;

  const crumbs = segs.map((seg, i) => {
    const href = "/" + segs.slice(0, i + 1).join("/");
    const label = LABELS[seg] ?? abbrev(seg);
    return { href, label };
  });

  return (
    <nav className="flex items-center gap-1 text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1 mt-0.5">
      <Link href="/" className="hover:text-foreground transition-colors">
        Dashboard
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          <ChevronRight size={10} className="opacity-50" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

function abbrev(seg: string) {
  // For ID segments (cuid/uuid-like), just show "…"
  if (/^[a-z0-9_-]{10,}$/i.test(seg)) return "…";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}
