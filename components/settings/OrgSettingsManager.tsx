"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateOrgSettings } from "@/app/settings/coach-actions";

type Org = {
  orgName: string;
  publicHeading: string;
  publicTagline: string;
  reportFooter: string;
};

export function OrgSettingsManager({ org }: { org: Org }) {
  const [orgName, setOrgName] = useState(org.orgName);
  const [publicHeading, setPublicHeading] = useState(org.publicHeading);
  const [publicTagline, setPublicTagline] = useState(org.publicTagline);
  const [reportFooter, setReportFooter] = useState(org.reportFooter);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (!orgName.trim() || !publicHeading.trim()) {
      toast.error("Org name and public heading required");
      return;
    }
    startTransition(async () => {
      try {
        await updateOrgSettings({
          orgName: orgName.trim(),
          publicHeading: publicHeading.trim(),
          publicTagline: publicTagline.trim(),
          reportFooter: reportFooter.trim(),
        });
        toast.success("Saved");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-section-header">Org info</h3>
        <p className="text-[12px] text-mute-1">
          Used in the public curriculum link header and on report cards.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">Organization name</Label>
          <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Public page heading</Label>
          <Input
            value={publicHeading}
            onChange={(e) => setPublicHeading(e.target.value)}
            placeholder="e.g. Curriculum schedule"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Public page tagline</Label>
          <Input
            value={publicTagline}
            onChange={(e) => setPublicTagline(e.target.value)}
            placeholder="e.g. What we cover each Saturday, by timeslot."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Report card footer line</Label>
          <Textarea
            rows={2}
            value={reportFooter}
            onChange={(e) => setReportFooter(e.target.value)}
            placeholder="e.g. Coach's assessment, not an academic grade."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
