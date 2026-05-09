import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronLeft,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  Clock,
  MessageCircle,
  Cake,
  School,
  Sparkles,
  Megaphone,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { TrialStatusMenu } from "@/components/trials/TrialStatusMenu";
import { AssessmentForm } from "@/components/trials/AssessmentForm";
import { ConvertButton } from "@/components/trials/ConvertButton";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import type { TrialStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<TrialStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  ATTENDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NO_SHOW: "bg-mute-3 text-mute-1 border-mute-3",
  CONVERTED: "bg-amber-50 text-amber-700 border-amber-200",
  DECLINED: "bg-red-50 text-red-700 border-red-200",
};
const STATUS_LABEL: Record<TrialStatus, string> = {
  SCHEDULED: "Scheduled",
  ATTENDED: "Attended",
  NO_SHOW: "No-show",
  CONVERTED: "Joined",
  DECLINED: "Declined",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TrialDetailPage({ params }: PageProps) {
  const { id } = await params;
  const trial = await prisma.trialStudent.findUnique({
    where: { id },
    include: { assessment: { include: { coach: true } } },
  });
  if (!trial) notFound();

  return (
    <AppShell
      title={`${trial.firstName} ${trial.lastName}`}
      actions={
        <>
          <ConvertButton
            trialId={trial.id}
            trialName={`${trial.firstName} ${trial.lastName}`}
            alreadyConverted={trial.status === "CONVERTED"}
          />
          <TrialStatusMenu id={trial.id} current={trial.status} />
        </>
      }
    >
      <div className="space-y-5">
        <Link
          href="/trial-students"
          className="inline-flex items-center gap-1 text-[12.5px] text-mute-1 hover:text-foreground"
        >
          <ChevronLeft size={14} /> Back to trials
        </Link>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[20px] font-extrabold tracking-tight text-foreground">
              {trial.firstName} {trial.lastName}
            </h2>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-[0.03em] border",
                STATUS_BADGE[trial.status]
              )}
            >
              {STATUS_LABEL[trial.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            <Fact icon={CalendarDays} label="Date">
              {format(trial.scheduledAt, "EEE, MMM d, yyyy")}
            </Fact>
            <Fact icon={Clock} label="Timeslot">
              {trial.timeslot}
            </Fact>
            <Fact icon={GraduationCap} label="Grade">
              {trial.grade ?? "—"}
            </Fact>
            <Fact icon={Cake} label="Birthdate">
              {trial.birthdate
                ? format(trial.birthdate, "MMM d, yyyy")
                : "—"}
            </Fact>
            <Fact icon={School} label="Current school">
              {trial.currentSchool ?? "—"}
            </Fact>
            <Fact icon={Sparkles} label="STEM experience">
              {formatStem(trial.stemExperience, trial.stemDetails)}
            </Fact>
            <Fact icon={Megaphone} label="Heard about us via">
              {formatReferral(trial.referralSource, trial.referralDetails)}
            </Fact>
            <Fact label="Parent">{trial.parentName ?? "—"}</Fact>
            <Fact icon={Mail} label="Parent email">
              {trial.parentEmail ?? "—"}
            </Fact>
            <Fact icon={Phone} label="Parent phone">
              {trial.parentPhone ?? "—"}
            </Fact>
            <Fact icon={MessageCircle} label="Preferred messaging">
              {trial.commPref === "WECHAT" ? "WeChat" : "WhatsApp"}
            </Fact>
            {trial.commPref === "WECHAT" && (
              <Fact icon={MessageCircle} label="Parent WeChat ID">
                {trial.parentWechat ?? "—"}
              </Fact>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/trial-students/${trial.id}/edit`}>Edit details</Link>
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-section-header">Coach assessment</h3>
            {trial.assessment && (
              <span className="text-[11px] text-mute-1">
                Submitted {format(trial.assessment.submittedAt, "MMM d, h:mm a")}{" "}
                by {trial.assessment.coach.name}
              </span>
            )}
          </div>
          <AssessmentForm
            trialStudentId={trial.id}
            studentFirstName={trial.firstName}
            initial={
              trial.assessment
                ? {
                    enthusiasm: trial.assessment.enthusiasm,
                    capability: trial.assessment.capability,
                    challenge: trial.assessment.challenge,
                    attention: trial.assessment.attention,
                    questioning: trial.assessment.questioning,
                    vexKnowledge: trial.assessment.vexKnowledge,
                    problemSolving: trial.assessment.problemSolving,
                    fitNotes: trial.assessment.fitNotes,
                    recommend: trial.assessment.recommend,
                  }
                : undefined
            }
          />
        </div>

        {/* Compose-email card — only useful once an assessment exists. */}
        {trial.assessment && (
          <div className="bg-card border border-border rounded-[var(--radius)] shadow-card p-5 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-section-header">Parent email</h3>
              <p className="text-[12.5px] text-mute-1 mt-0.5">
                Copy the composed email text and paste it into your mail
                client.
              </p>
            </div>
            <Button size="sm" variant="default" asChild>
              <Link href={`/trial-students/${trial.id}/email`}>
                Compose email →
              </Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon?: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.05em] font-bold text-mute-1 flex items-center gap-1.5">
        {Icon && <Icon size={11} />} {label}
      </div>
      <div className="mt-0.5 text-foreground">{children}</div>
    </div>
  );
}

const STEM_LABEL: Record<string, string> = {
  NONE: "None — first exposure",
  SOME: "Some prior exposure",
  EXPERIENCED: "Experienced",
};

function formatStem(level: string | null, details: string | null) {
  if (!level) return "—";
  const base = STEM_LABEL[level] ?? level;
  return details ? `${base} · ${details}` : base;
}

const REFERRAL_LABEL: Record<string, string> = {
  FRIEND: "Friend / family",
  GOOGLE: "Google search",
  SOCIAL_MEDIA: "Social media",
  SCHOOL: "School",
  EVENT: "Event / fair",
  RETURNING: "Returning family",
  OTHER: "Other",
};

function formatReferral(source: string | null, details: string | null) {
  if (!source) return "—";
  const base = REFERRAL_LABEL[source] ?? source;
  return details ? `${base} · ${details}` : base;
}
