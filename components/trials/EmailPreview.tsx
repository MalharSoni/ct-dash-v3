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
  const [copied, setCopied] = useState<"rich" | "plain" | "subject" | null>(
    null
  );

  /**
   * Rich copy: writes both text/html and text/plain to the clipboard so
   * Outlook / Gmail / Apple Mail paste with formatting (bold, callouts,
   * cost table, CTA button) intact, while a plain-text editor still gets
   * readable output.
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

  async function copyPlain() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied("plain");
      toast.success("Plain text copied");
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
          {copied === "rich" ? (
            <Check size={16} />
          ) : (
            <Mail size={16} />
          )}
          {copied === "rich" ? "Copied — paste into Outlook" : "Copy email for Outlook"}
        </Button>
        <div className="text-[12.5px] text-mute-1 leading-snug">
          Open a new Outlook message, paste the subject above into the subject line,
          <br className="hidden sm:inline" />
          then paste the email into the body. Formatting will carry over.
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copySubject}>
          {copied === "subject" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "subject" ? "Subject copied" : "Copy subject"}
        </Button>
        <Button size="sm" variant="ghost" onClick={copyPlain}>
          {copied === "plain" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "plain" ? "Copied" : "Copy plain text"}
        </Button>
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
