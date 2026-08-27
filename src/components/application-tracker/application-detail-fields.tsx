"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { SaveStatus } from "@/components/profile/save-status";
import { DeleteApplicationButton } from "@/components/application-tracker/delete-application-button";
import { PropertyRow, RequiredMark } from "@/components/shared/property-row";
import {
  InterviewRoundTimeline,
  type InterviewRoundItem,
} from "@/components/application-tracker/interview-round-timeline";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { getStageColor } from "@/lib/application-tracker/stage-colors";
import { updateApplicationFields } from "@/app/[locale]/(app)/application-tracker/actions";

const STAGES = ["WISHLIST", "APPLIED", "INTERVIEWING", "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN"];

export interface LinkedFileOption extends ComboboxOption {
  token: string;
}

export interface ApplicationDetailFieldsProps {
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
  resumeOptions: LinkedFileOption[];
  coverLetterOptions: LinkedFileOption[];
  rounds: InterviewRoundItem[];
}

export function ApplicationDetailFields({
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
}: ApplicationDetailFieldsProps) {
  const t = useTranslations("applicationTracker.editor");
  const tStages = useTranslations("applicationTracker.stages");
  const [stage, setStage] = useState(initialStage);
  const [jobUrl, setJobUrl] = useState(initialJobUrl);
  const [resumeDocumentId, setResumeDocumentId] = useState(initialResumeDocumentId);
  const [coverLetterId, setCoverLetterId] = useState(initialCoverLetterId);

  const save = useCallback((formData: FormData) => updateApplicationFields(id, formData), [id]);
  const { formRef, status, handleChange } = useAutoSaveForm(save);

  const selectedResume = resumeOptions.find((option) => option.value === resumeDocumentId);
  const selectedCoverLetter = coverLetterOptions.find((option) => option.value === coverLetterId);

  return (
    <div className="space-y-6">
      <form ref={formRef} onChange={handleChange} className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="companyName" className="text-xs text-muted-foreground">
                {t("companyLabel")} <RequiredMark />
              </label>
              <input
                id="companyName"
                name="companyName"
                defaultValue={initialCompanyName}
                placeholder={t("companyPlaceholder")}
                className="w-full truncate rounded-xl border border-input bg-transparent px-3.5 py-2 text-lg font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="positionTitle" className="text-xs text-muted-foreground">
                {t("positionLabel")} <RequiredMark />
              </label>
              <input
                id="positionTitle"
                name="positionTitle"
                defaultValue={initialPositionTitle}
                placeholder={t("positionPlaceholder")}
                className="w-full truncate rounded-xl border border-input bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <SaveStatus status={status} namespace="applicationTracker" />
        </div>

        <div className="mt-5 divide-y divide-border/60">
          <PropertyRow label={t("stageLabel")}>
            <div className="flex items-center gap-2">
              <span className={`size-2 shrink-0 rounded-full ${getStageColor(stage).dot}`} />
              <Combobox
                className="h-8 rounded-lg border-input px-2"
                value={stage}
                onChange={(value) => {
                  setStage(value);
                  handleChange();
                }}
                options={STAGES.map((value) => ({ value, label: tStages(value) }))}
              />
            </div>
            <input type="hidden" name="stage" value={stage} readOnly />
          </PropertyRow>

          <PropertyRow label={t("jobUrlLabel")}>
            <div className="flex items-center gap-1.5">
              <Input
                name="jobUrl"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder={t("notSet")}
                className="h-8 border-input px-2"
              />
              {jobUrl.trim() && (
                <a
                  href={jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t("openLink")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </PropertyRow>

          <PropertyRow label={t("locationLabel")}>
            <Input
              name="location"
              defaultValue={initialLocation}
              placeholder={t("notSet")}
              className="h-8 border-input px-2"
            />
          </PropertyRow>

          <PropertyRow label={t("appliedAtLabel")}>
            <Input
              name="appliedAt"
              type="date"
              defaultValue={initialAppliedAt}
              className="h-8 border-input px-2"
            />
          </PropertyRow>

          <PropertyRow label={t("resumeLabel")}>
            <div className="flex items-center gap-1.5">
              <Combobox
                className="h-8 flex-1 rounded-lg border-input px-2"
                value={resumeDocumentId}
                onChange={(value) => {
                  setResumeDocumentId(value);
                  handleChange();
                }}
                options={[{ value: "", label: t("resumeNone") }, ...resumeOptions]}
              />
              <input type="hidden" name="resumeDocumentId" value={resumeDocumentId} readOnly />
              {selectedResume && (
                <Link
                  href={`/resume-builder/${selectedResume.token}`}
                  aria-label={t("viewResume")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </Link>
              )}
            </div>
          </PropertyRow>

          <PropertyRow label={t("coverLetterLabel")}>
            <div className="flex items-center gap-1.5">
              <Combobox
                className="h-8 flex-1 rounded-lg border-input px-2"
                value={coverLetterId}
                onChange={(value) => {
                  setCoverLetterId(value);
                  handleChange();
                }}
                options={[{ value: "", label: t("coverLetterNone") }, ...coverLetterOptions]}
              />
              <input type="hidden" name="coverLetterId" value={coverLetterId} readOnly />
              {selectedCoverLetter && (
                <Link
                  href={`/cover-letter/${selectedCoverLetter.token}`}
                  aria-label={t("viewCoverLetter")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                </Link>
              )}
            </div>
          </PropertyRow>
        </div>

        <div className="mt-6 space-y-1.5">
          <label htmlFor="notes" className="text-xs text-muted-foreground">
            {t("notesLabel")}
          </label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={initialNotes}
            rows={4}
            placeholder={t("notSet")}
          />
        </div>
      </form>

      <InterviewRoundTimeline applicationId={id} rounds={rounds} />

      <div className="flex justify-end">
        <DeleteApplicationButton id={id} />
      </div>
    </div>
  );
}
