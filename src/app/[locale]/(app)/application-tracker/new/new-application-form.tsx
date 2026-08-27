"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import { getStageColor } from "@/lib/application-tracker/stage-colors";
import { PropertyRow, RequiredMark } from "@/components/shared/property-row";
import { createApplication } from "../actions";

const STAGES = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

interface NewApplicationFormProps {
  initialStage?: string;
  resumeOptions: ComboboxOption[];
  coverLetterOptions: ComboboxOption[];
}

export function NewApplicationForm({
  initialStage = "APPLIED",
  resumeOptions,
  coverLetterOptions,
}: NewApplicationFormProps) {
  const t = useTranslations("applicationTracker.new");
  const tStages = useTranslations("applicationTracker.stages");
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [stage, setStage] = useState(initialStage);
  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [resumeDocumentId, setResumeDocumentId] = useState("");
  const [coverLetterId, setCoverLetterId] = useState("");
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(companyName.trim() && positionTitle.trim());

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("companyName", companyName);
      formData.set("positionTitle", positionTitle);
      formData.set("stage", stage);
      formData.set("jobUrl", jobUrl);
      formData.set("location", location);
      formData.set("resumeDocumentId", resumeDocumentId);
      formData.set("coverLetterId", coverLetterId);

      const result = await createApplication(formData);
      if ("error" in result) {
        toast.add({ title: t("toastCreateError"), type: "error" });
        return;
      }
      trackEvent("application_created", { stage });
      toast.add({ title: t("toastCreateSuccess"), type: "success" });
      router.push("/application-tracker");
    });
  }

  return (
    <div className="mt-6 space-y-1">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="companyName" className="text-xs text-muted-foreground">
            {t("companyLabel")} <RequiredMark />
          </label>
          <input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
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
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder={t("positionPlaceholder")}
            className="w-full truncate rounded-xl border border-input bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="mt-5 divide-y divide-border/60">
        <PropertyRow label={t("stageLabel")}>
          <div className="flex items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${getStageColor(stage).dot}`} />
            <Combobox
              className="h-8 rounded-lg border-input px-2"
              value={stage}
              onChange={setStage}
              options={STAGES.map((value) => ({ value, label: tStages(value) }))}
            />
          </div>
        </PropertyRow>

        <PropertyRow label={t("jobUrlLabel")}>
          <Input
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder={t("jobUrlPlaceholder")}
            className="h-8 border-input px-2"
          />
        </PropertyRow>

        <PropertyRow label={t("locationLabel")}>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("locationPlaceholder")}
            className="h-8 border-input px-2"
          />
        </PropertyRow>

        <PropertyRow label={t("resumeLabel")}>
          <Combobox
            className="h-8 rounded-lg border-input px-2"
            value={resumeDocumentId}
            onChange={setResumeDocumentId}
            options={[{ value: "", label: t("resumeNone") }, ...resumeOptions]}
          />
        </PropertyRow>

        <PropertyRow label={t("coverLetterLabel")}>
          <Combobox
            className="h-8 rounded-lg border-input px-2"
            value={coverLetterId}
            onChange={setCoverLetterId}
            options={[{ value: "", label: t("coverLetterNone") }, ...coverLetterOptions]}
          />
        </PropertyRow>
      </div>

      <div className="pt-5">
        <Button size="lg" className="w-full" disabled={!canSubmit || isPending} onClick={handleSubmit}>
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}
