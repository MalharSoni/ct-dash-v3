"use client";

import { useState, useTransition } from "react";
import { Loader2, Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrial, updateTrial } from "@/app/trial-students/actions";
import { cn } from "@/lib/utils";
import type {
  CommPreference,
  StemExperience,
  ReferralSource,
} from "@prisma/client";

type Initial = {
  id?: string;
  firstName?: string;
  lastName?: string;
  parentName?: string | null;
  parentEmail?: string | null;
  parentPhone?: string | null;
  parentWechat?: string | null;
  commPref?: CommPreference;
  grade?: number | null;
  birthdate?: Date | null;
  currentSchool?: string | null;
  stemExperience?: StemExperience | null;
  stemDetails?: string | null;
  referralSource?: ReferralSource | null;
  referralDetails?: string | null;
  scheduledAt?: Date;
  timeslot?: string;
};

interface Props {
  initial?: Initial;
}

const TIMESLOTS: { label: string; hint: string; icon: typeof Sunrise }[] = [
  { label: "Morning 1", hint: "9:00–11:00 AM", icon: Sunrise },
  { label: "Morning 2", hint: "11:15 AM–1:15 PM", icon: Sun },
  { label: "Afternoon 1", hint: "1:30–3:30 PM", icon: Sunset },
  { label: "Afternoon 2", hint: "3:45–5:45 PM", icon: Moon },
];

const STEM_OPTIONS: { value: StemExperience; label: string; hint: string }[] = [
  { value: "NONE",        label: "None",        hint: "First exposure to STEM" },
  { value: "SOME",        label: "Some",        hint: "Has tried a few things" },
  { value: "EXPERIENCED", label: "Experienced", hint: "Robotics / coding background" },
];

const REFERRAL_OPTIONS: { value: ReferralSource; label: string }[] = [
  { value: "FRIEND",       label: "Friend / family" },
  { value: "GOOGLE",       label: "Google search" },
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "SCHOOL",       label: "School" },
  { value: "EVENT",        label: "Event / fair" },
  { value: "RETURNING",    label: "Returning family" },
  { value: "OTHER",        label: "Other" },
];

function todayLocalISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalDate(d?: Date) {
  if (!d) return todayLocalISO();
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function TrialForm({ initial }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [parentName, setParentName] = useState(initial?.parentName ?? "");
  const [parentEmail, setParentEmail] = useState(initial?.parentEmail ?? "");
  const [parentPhone, setParentPhone] = useState(initial?.parentPhone ?? "");
  const [parentWechat, setParentWechat] = useState(initial?.parentWechat ?? "");
  const [commPref, setCommPref] = useState<CommPreference>(
    initial?.commPref ?? "WHATSAPP"
  );
  const [grade, setGrade] = useState(initial?.grade?.toString() ?? "");
  const [birthdate, setBirthdate] = useState(
    initial?.birthdate ? toLocalDate(initial.birthdate) : ""
  );
  const [currentSchool, setCurrentSchool] = useState(
    initial?.currentSchool ?? ""
  );
  const [stemExperience, setStemExperience] = useState<StemExperience | "">(
    initial?.stemExperience ?? ""
  );
  const [stemDetails, setStemDetails] = useState(initial?.stemDetails ?? "");
  const [referralSource, setReferralSource] = useState<ReferralSource | "">(
    initial?.referralSource ?? ""
  );
  const [referralDetails, setReferralDetails] = useState(
    initial?.referralDetails ?? ""
  );
  const [scheduledAt, setScheduledAt] = useState(toLocalDate(initial?.scheduledAt));
  const [timeslot, setTimeslot] = useState(initial?.timeslot ?? TIMESLOTS[0].label);
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(initial?.id);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !scheduledAt || !timeslot) {
      toast.error("Name, date, and timeslot are required");
      return;
    }
    if (commPref === "WECHAT" && !parentWechat.trim()) {
      toast.error("Please share the parent's WeChat ID");
      return;
    }
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      parentName: parentName.trim() || null,
      parentEmail: parentEmail.trim() || null,
      parentPhone: parentPhone.trim() || null,
      parentWechat: parentWechat.trim() || null,
      commPref,
      grade: grade ? Number(grade) : null,
      birthdate: birthdate || null,
      currentSchool: currentSchool.trim() || null,
      stemExperience: stemExperience || null,
      stemDetails: stemDetails.trim() || null,
      referralSource: referralSource || null,
      referralDetails: referralDetails.trim() || null,
      scheduledAt,
      timeslot,
    };
    startTransition(async () => {
      try {
        if (isEdit && initial?.id) {
          await updateTrial(initial.id, payload);
          toast.success("Trial updated");
        } else {
          await createTrial(payload);
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
        toast.error(e instanceof Error ? e.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {/* Student */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Student</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>First name *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Last name *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Grade</Label>
            <Input
              type="number"
              min={1}
              max={13}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Birthdate</Label>
            <Input
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Current school</Label>
          <Input
            value={currentSchool}
            onChange={(e) => setCurrentSchool(e.target.value)}
            placeholder="e.g. Markville Secondary School"
          />
        </div>
      </div>

      {/* Background */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-4">
        <h3 className="text-section-header">About the student</h3>

        <div className="space-y-1.5">
          <Label>Experience with extracurricular STEM</Label>
          <div className="grid grid-cols-3 gap-2">
            {STEM_OPTIONS.map(({ value, label, hint }) => {
              const active = stemExperience === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStemExperience(active ? "" : value)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-brand-bg border-brand text-foreground shadow-sm"
                      : "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
                  )}
                  aria-pressed={active}
                >
                  <span className="text-[12.5px] font-semibold">{label}</span>
                  <span className="text-[11px] text-mute-1">{hint}</span>
                </button>
              );
            })}
          </div>
          {stemExperience && stemExperience !== "NONE" && (
            <Textarea
              rows={2}
              value={stemDetails}
              onChange={(e) => setStemDetails(e.target.value)}
              placeholder="Robotics teams, coding camps, science clubs — anything relevant."
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Where did you hear about Caution Tape?</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REFERRAL_OPTIONS.map(({ value, label }) => {
              const active = referralSource === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setReferralSource(active ? "" : value)}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-3 py-2 text-[12.5px] font-semibold transition-colors",
                    active
                      ? "bg-brand-bg border-brand text-foreground shadow-sm"
                      : "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {(referralSource === "FRIEND" ||
            referralSource === "SCHOOL" ||
            referralSource === "EVENT" ||
            referralSource === "OTHER") && (
            <Input
              value={referralDetails}
              onChange={(e) => setReferralDetails(e.target.value)}
              placeholder={
                referralSource === "FRIEND"
                  ? "Friend or family member's name (optional)"
                  : referralSource === "SCHOOL"
                  ? "Which school?"
                  : referralSource === "EVENT"
                  ? "Which event or fair?"
                  : "Tell us more (optional)"
              }
            />
          )}
        </div>
      </div>

      {/* Schedule — date-only + 4 timeslot buttons */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-4">
        <h3 className="text-section-header">Schedule</h3>

        <div className="space-y-1.5">
          <Label>Date *</Label>
          <Input
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <p className="text-[11px] text-mute-1">
            Defaults to today. The exact start time is the timeslot below.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Timeslot *</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIMESLOTS.map(({ label, hint, icon: Icon }) => {
              const active = timeslot === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTimeslot(label)}
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "bg-brand-bg border-brand text-foreground shadow-sm"
                      : "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
                  )}
                  aria-pressed={active}
                >
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                    <Icon size={13} />
                    {label}
                  </span>
                  <span className="text-[11px] text-mute-1">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className="bg-card border border-border rounded-[var(--radius)] p-4 shadow-card space-y-3">
        <h3 className="text-section-header">Parent / Guardian</h3>
        <div className="space-y-1.5">
          <Label>Parent name</Label>
          <Input value={parentName} onChange={(e) => setParentName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Parent email</Label>
            <Input
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Parent phone</Label>
            <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
          </div>
        </div>

        {/* Comm preference */}
        <div className="space-y-1.5">
          <Label>Preferred messaging app *</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["WHATSAPP", "WECHAT"] as const).map((p) => {
              const active = commPref === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCommPref(p)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-sm)] border text-[13px] font-semibold transition-colors",
                    active
                      ? "bg-brand-bg border-brand text-foreground shadow-sm"
                      : "bg-card border-border text-mute-1 hover:text-foreground hover:border-mute-2"
                  )}
                  aria-pressed={active}
                >
                  {p === "WHATSAPP" ? "WhatsApp" : "WeChat"}
                </button>
              );
            })}
          </div>
        </div>

        {commPref === "WECHAT" && (
          <div className="space-y-1.5">
            <Label>Parent WeChat ID *</Label>
            <Input
              value={parentWechat}
              onChange={(e) => setParentWechat(e.target.value)}
              placeholder="wechat-id"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={() => history.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEdit ? "Save changes" : "Schedule trial"}
        </Button>
      </div>
    </form>
  );
}
