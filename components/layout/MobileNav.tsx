"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";

interface Props {
  title: string;
  actions?: React.ReactNode;
}

export function MobileNav({ title, actions }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-full px-3 flex items-center justify-between gap-2">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9">
            <Menu size={18} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div onClick={() => setOpen(false)}>
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="text-[15px] font-extrabold tracking-tight text-foreground truncate flex-1">
        {title}
      </h1>

      <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
    </div>
  );
}
