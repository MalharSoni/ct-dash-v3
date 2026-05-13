"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  subject: string;
  body: string;
  html: string;
  to?: string | null;
}

export function EmailPreview({ subject, body, html, to }: Props) {
  const [copied, setCopied] = useState<"rich" | "subject" | null>(null);

  /**
   * Single copy action: writes both text/html (formatted) and text/plain
   * (fallback) to the clipboard. Outlook / Gmail / Apple Mail paste the
   * formatted version; a plain-text target (terminal, Slack) automatically
   * picks up the text fallback. There's no separate "plain text" button
   * because this one already covers both.
   */
  async function copyRich() {
    try {
      if ("ClipboardItem" in window) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([body], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(body);
      }
      setCopied("rich");
      toast.success("Email copied — paste into Outlook compose");
      setTimeout(() => setCopied(null), 2200);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Copy failed");
    }
  }

  async function copySubject() {
    try {
      await navigator.clipboard.writeText(subject);
      setCopied("subject");
      toast.success("Subject copied");
      setTimeout(() => setCopied(null), 2200);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Copy failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Primary action: one-click copy of the full formatted email body. */}
      <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-4 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={copyRich} className="font-semibold">
          {copied === "rich" ? <Check size={16} /> : <Mail size={16} />}
          {copied === "rich" ? "Copied — paste into Outlook" : "Copy email for Outlook"}
        </Button>
        <Button size="sm" variant="outline" onClick={copySubject}>
          {copied === "subject" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "subject" ? "Subject copied" : "Copy subject"}
        </Button>
        <div className="text-[12.5px] text-mute-1 leading-snug w-full">
          1. <strong className="text-foreground">Copy subject</strong> &rarr; paste into Outlook&rsquo;s subject line.
          {" "}
          2. <strong className="text-foreground">Copy email for Outlook</strong> &rarr; paste into the message body.
          {" "}
          Formatting carries over.
        </div>
      </div>

      {to && <Field label="To" value={to} />}
      <Field label="Subject" value={subject} />

      <div className="space-y-1.5">
        <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
          Preview — this is what the parent will see when you paste
        </div>
        <div className="rounded-[var(--radius)] border border-border overflow-hidden bg-mute-4/40">
          <iframe
            title="Email preview"
            srcDoc={html}
            className="w-full h-[680px] bg-white border-0"
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius)] shadow-card px-4 py-2.5">
      <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1 mb-0.5">
        {label}
      </div>
      <div className="text-[13px] text-foreground">{value}</div>
    </div>
  );
}
