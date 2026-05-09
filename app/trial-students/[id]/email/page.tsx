import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
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

  // Guard rails — make it obvious why the page can't render the email.
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
  if (!trial.parentEmail) {
    return (
      <AppShell title={`Email — ${trial.firstName} ${trial.lastName}`}>
        <div className="space-y-3 max-w-xl">
          <BackLink id={id} />
          <Notice
            title="Parent email is missing"
            body={
              <>
                Add a parent email on the trial details first.{" "}
                <Link
                  href={`/trial-students/${id}/edit`}
                  className="text-info hover:underline font-semibold"
                >
                  Edit trial →
                </Link>
              </>
            }
          />
        </div>
      </AppShell>
    );
  }

  const parentFirstName = pickParentFirstName(trial.parentName);

  const rendered = renderTrialEmail({
    parent: { firstName: parentFirstName, email: trial.parentEmail },
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
            Copy the email below into Gmail/Outlook and send to{" "}
            <strong className="text-foreground">{trial.parentEmail}</strong>.
            When done, click <em>Mark as sent</em> at the bottom.
          </p>
        </div>

        <EmailPreview
          trialStudentId={id}
          rendered={rendered}
          ccList={org.emailCcList}
          alreadySentAt={
            trial.assessment.emailSentAt
              ? trial.assessment.emailSentAt.toISOString()
              : null
          }
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
  if (!parentName) return "there"; // safest fallback
  const trimmed = parentName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}
