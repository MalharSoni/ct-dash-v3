"use client";

import { useState, useTransition } from "react";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { importCurriculumCSV } from "@/app/curriculum/actions";

const SAMPLE = `saturday,timeslot,title,phase,description
2025-09-06,Morning 1,Game Analysis,FOUNDATION,Watch reveal & rules walk
2025-09-06,Morning 2,HeroBot Build,VRC,
2025-09-13,,Civic Holiday,BREAK,No class — Labour Day weekend
2025-09-20,Morning 1,Engineering Notebook,PROJECT,
2025-09-20,Afternoon 1,Drivetrain testing,VRC,Tune the X-drive`;

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<{
    weeksUpserted: number;
    entriesUpserted: number;
    breaks: number;
    errors: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleImport() {
    if (!csv.trim()) {
      toast.error("Paste some CSV first");
      return;
    }
    startTransition(async () => {
      try {
        const r = await importCurriculumCSV(csv);
        setResult(r);
        if (r.errors.length === 0) {
          toast.success(
            `Imported ${r.entriesUpserted} lessons across ${r.weeksUpserted} weeks (${r.breaks} breaks)`
          );
        } else {
          toast.warning(
            `Imported with ${r.errors.length} error${r.errors.length !== 1 ? "s" : ""}`
          );
        }
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Import failed");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setResult(null);
          setCsv("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload size={14} /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import curriculum from CSV</DialogTitle>
          <DialogDescription>
            Paste a CSV with header{" "}
            <code className="text-[11px] bg-mute-4 px-1 py-0.5 rounded">
              saturday,timeslot,title,phase,description
            </code>
            . Existing rows will be updated, not duplicated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="csv">CSV</Label>
            <Textarea
              id="csv"
              rows={10}
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder={SAMPLE}
              className="font-mono text-[11.5px]"
            />
            <button
              type="button"
              onClick={() => setCsv(SAMPLE)}
              className="text-[11px] text-mute-1 hover:text-foreground"
            >
              Use sample
            </button>
          </div>

          <details className="bg-mute-4/40 border border-border rounded-[var(--radius-sm)] p-2.5 text-[11.5px]">
            <summary className="font-semibold cursor-pointer">
              Format reference
            </summary>
            <ul className="mt-2 space-y-1 text-mute-1 list-disc list-inside">
              <li>
                <strong>saturday</strong>: YYYY-MM-DD
              </li>
              <li>
                <strong>timeslot</strong>: must match an existing column name
                (case-insensitive). Leave blank for break rows.
              </li>
              <li>
                <strong>phase</strong>: HANDS_ON, GUIDED_LESSON,
                COMPETITION — or <strong>BREAK</strong> for a whole-row
                break.
              </li>
              <li>
                <strong>description</strong>: optional notes shown to parents.
              </li>
            </ul>
          </details>

          {result && (
            <div className="border border-border rounded-[var(--radius-sm)] p-3 bg-mute-4/30 space-y-2">
              <div className="text-[12.5px]">
                <strong>{result.weeksUpserted}</strong> weeks ·{" "}
                <strong>{result.entriesUpserted}</strong> lessons ·{" "}
                <strong>{result.breaks}</strong> breaks
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] font-bold text-destructive flex items-center gap-1">
                    <AlertCircle size={11} /> {result.errors.length} error
                    {result.errors.length !== 1 ? "s" : ""}
                  </div>
                  <ul className="text-[11px] text-destructive max-h-24 overflow-y-auto space-y-0.5">
                    {result.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button size="sm" onClick={handleImport} disabled={isPending}>
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
