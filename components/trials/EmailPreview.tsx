"use client";

import { useState, useTransition } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { markEmailSent, unmarkEmailSent } from "@/app/trial-students/actions";
import { cn } from "@/lib/utils";
import type { RenderedEmail } from "@/lib/trial-email";

interface Props {
  trialStudentId: string;
  rendered: RenderedEmail;
  ccList: string[];
  alreadySentAt: string | null;
}

export function EmailPreview({
  trialStudentId,
  rendered,
  ccList,
  alreadySentAt,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<"html" | "text" | null>(null);

  async function copy(kind: "html" | "text") {
    try {
      if (kind === "html" && "ClipboardItem" in window) {
        // Rich HTML — Gmail/Outlook will paste it with formatting intact.
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([rendered.html], { type: "text/html" }),
            "text/plain": new Blob([rendered.text], { type: "text/plain" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(rendered.text);
      }
      setCopied(kind);
      toast.success(
        kind === "html"
          ? "HTML email copied — paste into Gmail or Outlook"
          : "Plain text copied"
      );
      setTimeout(() => setCopied(null), 2500);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Copy failed");
    }
  }

  function gmailUrl() {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: rendered.to,
      su: rendered.subject,
      body: rendered.text,
    });
    if (ccList.length > 0) params.set("cc", ccList.join(","));
    return `https://mail.google.com/mail/?${params.toString()}`;
  }

  function mailtoUrl() {
    const params = new URLSearchParams({
      subject: rendered.subject,
      body: rendered.text,
    });
    if (ccList.length > 0) params.set("cc", ccList.join(","));
    return `mailto:${rendered.to}?${params.toString()}`;
  }

  function toggleSent() {
    startTransition(async () => {
      try {
        if (alreadySentAt) {
          await unmarkEmailSent(trialStudentId);
          toast.success("Marked as not sent");
        } else {
          await markEmailSent(trialStudentId);
          toast.success("Marked as sent");
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Header card with To / Subject / CC */}
      <div className="bg-card border border-border rounded-[var(--radius)] shadow-card overflow-hidden">
        <Field label="To" value={rendered.to} />
        {ccList.length > 0 && <Field label="Cc" value={ccList.join(", ")} />}
        <Field label="Subject" value={rendered.subject} mono={false} />
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => copy("html")} disabled={isPending}>
          {copied === "html" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "html" ? "Copied" : "Copy email"}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={gmailUrl()} target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> Open in Gmail
          </a>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={mailtoUrl()}>
            <ExternalLink size={14} /> Default mail app
          </a>
        </Button>
      </div>

      {/* Preview tabs — visual (HTML rendered) and source (plain text). */}
      <Tabs defaultValue="visual" className="space-y-3">
        <TabsList className="justify-start">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="text">Plain text</TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <div className="bg-mute-4/40 rounded-[var(--radius)] border border-border overflow-hidden">
            <iframe
              title="Email preview"
              srcDoc={rendered.html}
              className="w-full h-[680px] bg-white border-0"
            />
          </div>
        </TabsContent>

        <TabsContent value="text">
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-4 relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy("text")}
              className="absolute top-3 right-3"
            >
              {copied === "text" ? <Check size={13} /> : <Copy size={13} />}
              {copied === "text" ? "Copied" : "Copy text"}
            </Button>
            <pre className="whitespace-pre-wrap text-[13px] font-sans text-foreground pr-24">
              {rendered.text}
            </pre>
          </div>
        </TabsContent>
      </Tabs>

      {/* Mark-as-sent footer */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius)] border p-4",
          alreadySentAt
            ? "bg-emerald-50 border-emerald-200"
            : "bg-mute-4/40 border-border"
        )}
      >
        <div className="text-[13px]">
          {alreadySentAt ? (
            <>
              <span className="font-semibold text-emerald-700">
                Sent
              </span>{" "}
              <span className="text-mute-1">
                · marked at{" "}
                {new Date(alreadySentAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </>
          ) : (
            <span className="text-mute-1">
              Once you've sent the email, mark it here so the trial card
              updates.
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={alreadySentAt ? "outline" : "default"}
          onClick={toggleSent}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : alreadySentAt ? (
            <RefreshCw size={13} />
          ) : (
            <Check size={13} />
          )}
          {alreadySentAt ? "Mark as not sent" : "Mark as sent"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-3 px-4 py-2.5 border-b last:border-b-0 border-border">
      <span className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1 w-12 shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "text-[13px] text-foreground min-w-0 truncate",
          mono && "font-mono"
        )}
      >
        {value}
      </span>
    </div>
  );
}
