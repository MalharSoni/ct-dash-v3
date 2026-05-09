import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmailPreview } from "@/components/trials/EmailPreview";
import { getOrgSettings } from "@/app/settings/coach-actions";
import { prisma } from "@/lib/prisma";
import { renderTrialEmail, nextSaturdayLabel } from "@/lib/trial-email";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TrialEmailPage({ params }: PageProps) {
  const { id } = await params;
  const [trial, org] = await Promise.all([
    prisma.trialStudent.findUnique({
      where: { id },
      include: { assessment: true },
    }),
    getOrgSettings(),
  ]);

  if (!trial) notFound();

  if (!trial.assessment) {
    return (
      <AppShell title={`Email — ${trial.firstName} ${trial.lastName}`}>
        <div className="space-y-3 max-w-xl">
          <BackLink id={id} />
          <Notice
            title="Coach assessment isn't done yet"
            body="Save the assessment on the trial page first — the chip-composed paragraph is the body of the parent email."
          />
        </div>
      </AppShell>
    );
  }

  const parentFirstName = pickParentFirstName(trial.parentName);

  const rendered = renderTrialEmail({
    parent: { firstName: parentFirstName, email: trial.parentEmail ?? "" },
    student: {
      firstName: trial.firstName,
      fullName: `${trial.firstName} ${trial.lastName}`,
    },
    coachParagraph: trial.assessment.fitNotes,
    recommend: trial.assessment.recommend,
    org,
    startDateLabel: nextSaturdayLabel(),
  });

  return (
    <AppShell
      title={`Email — ${trial.firstName} ${trial.lastName}`}
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href={`/trial-students/${id}`}>
            <ChevronLeft size={14} /> Back to trial
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-start gap-3 text-[12.5px] text-mute-1">
          <Mail size={14} className="mt-0.5 shrink-0" />
          <p>
            Copy the email below and paste it into your mail client to send to{" "}
            {trial.parentName ?? "the parent"}.
          </p>
        </div>

        <EmailPreview
          subject={rendered.subject}
          body={rendered.text}
          html={rendered.html}
          to={trial.parentEmail || null}
        />
      </div>
    </AppShell>
  );
}

function BackLink({ id }: { id: string }) {
  return (
    <Link
      href={`/trial-students/${id}`}
      className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
    >
      <ChevronLeft size={14} /> Back to trial
    </Link>
  );
}

function Notice({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5">
      <h3 className="text-section-header mb-1">{title}</h3>
      <p className="text-[13px] text-mute-1">{body}</p>
    </div>
  );
}

function pickParentFirstName(parentName: string | null): string {
  if (!parentName) return "there";
  const trimmed = parentName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}
