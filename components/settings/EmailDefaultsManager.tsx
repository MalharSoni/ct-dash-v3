"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateEmailDefaults } from "@/app/settings/coach-actions";

export type EmailDefaults = {
  senderName: string;
  senderCompany: string;
  programName: string;
  programAddress: string;
  whatsappNumber: string;
  registrationUrl: string;
  aiProgramUrl: string;
  materialPaymentEmail: string;
  monthlyFeeLabel: string;
  materialDepositLabel: string;
  materialBalanceLabel: string;
  materialRefreshLabel: string;
  foundationDurationLabel: string;
  emailCcList: string[];
};

export function EmailDefaultsManager({ defaults }: { defaults: EmailDefaults }) {
  const [d, setD] = useState<EmailDefaults>(defaults);
  const [ccDraft, setCcDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof EmailDefaults>(key: K, value: EmailDefaults[K]) {
    setD((prev) => ({ ...prev, [key]: value }));
  }

  function addCc() {
    const email = ccDraft.trim();
    if (!email) return;
    if (!email.includes("@")) {
      toast.error("Not an email");
      return;
    }
    if (d.emailCcList.includes(email)) {
      setCcDraft("");
      return;
    }
    update("emailCcList", [...d.emailCcList, email]);
    setCcDraft("");
  }

  function removeCc(email: string) {
    update(
      "emailCcList",
      d.emailCcList.filter((e) => e !== email)
    );
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await updateEmailDefaults(d);
        toast.success("Email defaults saved");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <Mail size={16} className="text-mute-1 mt-0.5" />
        <div>
          <h3 className="text-section-header">Trial acceptance email</h3>
          <p className="text-[12px] text-mute-1">
            Defaults used by{" "}
            <code className="font-mono text-[11px] bg-mute-4 px-1 py-0.5 rounded">
              /trial-students/[id]/email
            </code>
            . Edit a value here to change every future email.
          </p>
        </div>
      </div>

      <Section title="Sender">
        <Field label="Sender name">
          <Input
            value={d.senderName}
            onChange={(e) => update("senderName", e.target.value)}
          />
        </Field>
        <Field label="Sender company">
          <Input
            value={d.senderCompany}
            onChange={(e) => update("senderCompany", e.target.value)}
          />
        </Field>
        <Field label="Program name (e.g. High School Program)">
          <Input
            value={d.programName}
            onChange={(e) => update("programName", e.target.value)}
          />
        </Field>
        <Field label="Foundation duration label (e.g. 4-month)">
          <Input
            value={d.foundationDurationLabel}
            onChange={(e) =>
              update("foundationDurationLabel", e.target.value)
            }
          />
        </Field>
      </Section>

      <Section title="Contact + location">
        <Field label="Address line">
          <Input
            value={d.programAddress}
            onChange={(e) => update("programAddress", e.target.value)}
          />
        </Field>
        <Field label="WhatsApp number">
          <Input
            value={d.whatsappNumber}
            onChange={(e) => update("whatsappNumber", e.target.value)}
            placeholder="(647) 456-7788"
          />
        </Field>
        <Field label="E-Transfer recipient (material fees)">
          <Input
            type="email"
            value={d.materialPaymentEmail}
            onChange={(e) => update("materialPaymentEmail", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Links">
        <Field label="Registration URL">
          <Input
            value={d.registrationUrl}
            onChange={(e) => update("registrationUrl", e.target.value)}
          />
        </Field>
        <Field label="AI coding program URL (bonus link)">
          <Input
            value={d.aiProgramUrl}
            onChange={(e) => update("aiProgramUrl", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Fees">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Material deposit (Now)">
            <Input
              value={d.materialDepositLabel}
              onChange={(e) => update("materialDepositLabel", e.target.value)}
              placeholder="$200"
            />
          </Field>
          <Field label="Monthly fee">
            <Input
              value={d.monthlyFeeLabel}
              onChange={(e) => update("monthlyFeeLabel", e.target.value)}
              placeholder="$475 + tax"
            />
          </Field>
          <Field label="Material balance (end of Foundation)">
            <Input
              value={d.materialBalanceLabel}
              onChange={(e) => update("materialBalanceLabel", e.target.value)}
              placeholder="$800"
            />
          </Field>
          <Field label="Material refresh (every 2 yrs)">
            <Input
              value={d.materialRefreshLabel}
              onChange={(e) => update("materialRefreshLabel", e.target.value)}
              placeholder="$1,000"
            />
          </Field>
        </div>
      </Section>

      <Section title="CC list">
        <p className="text-[11.5px] text-mute-1 -mt-1">
          These emails are pre-filled in the Cc field on the email preview
          page so admin gets a copy of every recap.
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="ingrid@example.com"
            value={ccDraft}
            onChange={(e) => setCcDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCc();
              }
            }}
          />
          <Button type="button" size="sm" variant="outline" onClick={addCc}>
            Add
          </Button>
        </div>
        {d.emailCcList.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {d.emailCcList.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border bg-card text-[11.5px] font-medium"
              >
                {email}
                <button
                  type="button"
                  onClick={() => removeCc(email)}
                  className="text-mute-1 hover:text-destructive"
                  aria-label={`Remove ${email}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Save email defaults
        </Button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px]">{label}</Label>
      {children}
    </div>
  );
}
