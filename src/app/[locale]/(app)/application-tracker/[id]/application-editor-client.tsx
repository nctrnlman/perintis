"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { SaveStatus } from "@/components/profile/save-status";
import { DeleteApplicationButton } from "@/components/application-tracker/delete-application-button";
import {
  InterviewRoundTimeline,
  type InterviewRoundItem,
} from "@/components/application-tracker/interview-round-timeline";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { getStageColor } from "@/lib/application-tracker/stage-colors";
import { updateApplicationFields } from "../actions";

const STAGES = ["WISHLIST", "APPLIED", "INTERVIEWING", "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN"];

interface ApplicationEditorClientProps {
  id: string;
  initialCompanyName: string;
  initialPositionTitle: string;
  initialStage: string;
  initialJobUrl: string;
  initialLocation: string;
  initialNotes: string;
  initialAppliedAt: string;
  initialResumeDocumentId: string;
  initialCoverLetterId: string;
  resumeOptions: ComboboxOption[];
  coverLetterOptions: ComboboxOption[];
  rounds: InterviewRoundItem[];
}

export function ApplicationEditorClient({
  id,
  initialCompanyName,
  initialPositionTitle,
  initialStage,
  initialJobUrl,
  initialLocation,
  initialNotes,
  initialAppliedAt,
  initialResumeDocumentId,
  initialCoverLetterId,
  resumeOptions,
  coverLetterOptions,
  rounds,
}: ApplicationEditorClientProps) {
  const t = useTranslations("applicationTracker.editor");
  const tStages = useTranslations("applicationTracker.stages");
  const [stage, setStage] = useState(initialStage);
  const [resumeDocumentId, setResumeDocumentId] = useState(initialResumeDocumentId);
  const [coverLetterId, setCoverLetterId] = useState(initialCoverLetterId);

  const save = useCallback((formData: FormData) => updateApplicationFields(id, formData), [id]);
  const { formRef, status, handleChange } = useAutoSaveForm(save);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/application-tracker" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToBoard")}
        </Link>
      </div>

      <div className="rounded-2xl border border-border p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("detailsTitle")}</h2>
          <SaveStatus status={status} namespace="applicationTracker" />
        </div>

        <form ref={formRef} onChange={handleChange} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">{t("companyLabel")}</Label>
              <Input id="companyName" name="companyName" defaultValue={initialCompanyName} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="positionTitle">{t("positionLabel")}</Label>
              <Input id="positionTitle" name="positionTitle" defaultValue={initialPositionTitle} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("stageLabel")}</Label>
            <div className="flex items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${getStageColor(stage).dot}`} />
              <Combobox
                className="flex-1"
                value={stage}
                onChange={(value) => {
                  setStage(value);
                  handleChange();
                }}
                options={STAGES.map((value) => ({ value, label: tStages(value) }))}
              />
            </div>
            <input type="hidden" name="stage" value={stage} readOnly />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="jobUrl">{t("jobUrlLabel")}</Label>
              <Input id="jobUrl" name="jobUrl" defaultValue={initialJobUrl} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">{t("locationLabel")}</Label>
              <Input id="location" name="location" defaultValue={initialLocation} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appliedAt">{t("appliedAtLabel")}</Label>
            <Input id="appliedAt" name="appliedAt" type="date" defaultValue={initialAppliedAt} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea id="notes" name="notes" defaultValue={initialNotes} rows={4} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("resumeLabel")}</Label>
              <Combobox
                value={resumeDocumentId}
                onChange={(value) => {
                  setResumeDocumentId(value);
                  handleChange();
                }}
                options={[{ value: "", label: t("resumeNone") }, ...resumeOptions]}
              />
              <input type="hidden" name="resumeDocumentId" value={resumeDocumentId} readOnly />
            </div>
            <div className="space-y-1.5">
              <Label>{t("coverLetterLabel")}</Label>
              <Combobox
                value={coverLetterId}
                onChange={(value) => {
                  setCoverLetterId(value);
                  handleChange();
                }}
                options={[{ value: "", label: t("coverLetterNone") }, ...coverLetterOptions]}
              />
              <input type="hidden" name="coverLetterId" value={coverLetterId} readOnly />
            </div>
          </div>
        </form>
      </div>

      <InterviewRoundTimeline applicationId={id} rounds={rounds} />

      <div className="flex justify-end">
        <DeleteApplicationButton id={id} />
      </div>
    </div>
  );
}
