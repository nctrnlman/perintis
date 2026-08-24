"use client";

import { useState, useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import {
  addInterviewRound,
  deleteInterviewRound,
  updateInterviewRoundOutcome,
} from "@/app/[locale]/(app)/application-tracker/actions";

export interface InterviewRoundItem {
  id: string;
  label: string;
  scheduledAt: Date | null;
  outcome: "PENDING" | "PASSED" | "FAILED";
  notes: string | null;
}

export function InterviewRoundTimeline({
  applicationId,
  rounds,
}: {
  applicationId: string;
  rounds: InterviewRoundItem[];
}) {
  const t = useTranslations("applicationTracker.editor");
  const format = useFormatter();
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, startAddTransition] = useTransition();

  function handleAdd() {
    if (!label.trim()) return;
    startAddTransition(async () => {
      const formData = new FormData();
      formData.set("label", label);
      formData.set("scheduledAt", scheduledAt);
      formData.set("notes", notes);

      const result = await addInterviewRound(applicationId, formData);
      if ("error" in result) {
        toast.add({ title: t("toastRoundAddError"), type: "error" });
        return;
      }
      trackEvent("interview_round_added");
      setLabel("");
      setScheduledAt("");
      setNotes("");
      setShowForm(false);
    });
  }

  function handleOutcomeChange(roundId: string, outcome: string) {
    updateInterviewRoundOutcome(roundId, outcome);
  }

  function handleDelete(roundId: string) {
    deleteInterviewRound(roundId).then((result) => {
      if ("error" in result) {
        toast.add({ title: t("toastRoundDeleteError"), type: "error" });
        return;
      }
      trackEvent("interview_round_deleted");
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("roundsTitle")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          <Plus className="size-4" />
          {t("addRoundButton")}
        </Button>
      </div>

      {showForm && (
        <div className="mt-5 space-y-3 rounded-xl border border-border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="roundLabel">{t("roundLabelLabel")}</Label>
            <Input
              id="roundLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t("roundLabelPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roundDate">{t("roundDateLabel")}</Label>
            <Input
              id="roundDate"
              type="date"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roundNotes">{t("roundNotesLabel")}</Label>
            <Input id="roundNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <Button size="sm" disabled={!label.trim() || isAdding} onClick={handleAdd}>
            {t("roundSubmit")}
          </Button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {rounds.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">{t("roundsEmpty")}</p>
        )}
        {rounds.map((round) => (
          <div
            key={round.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium">{round.label}</p>
              {round.scheduledAt && (
                <p className="text-xs text-muted-foreground">
                  {format.dateTime(round.scheduledAt, { dateStyle: "medium" })}
                </p>
              )}
              {round.notes && <p className="mt-1 text-sm text-muted-foreground">{round.notes}</p>}
            </div>
            <Combobox
              className="w-36"
              value={round.outcome}
              onChange={(value) => handleOutcomeChange(round.id, value)}
              options={[
                { value: "PENDING", label: t("outcomePending") },
                { value: "PASSED", label: t("outcomePassed") },
                { value: "FAILED", label: t("outcomeFailed") },
              ]}
            />
            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(round.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
