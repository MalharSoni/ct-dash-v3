"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintTrigger() {
  useEffect(() => {
    // Brief delay so fonts and images load.
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden bg-mute-4 border-b border-border px-6 py-2 flex items-center justify-between">
      <span className="text-[12px] text-mute-1">
        Use your browser&apos;s print dialog to save as PDF.
      </span>
      <Button size="sm" onClick={() => window.print()}>
        <Printer size={13} /> Print again
      </Button>
    </div>
  );
}
