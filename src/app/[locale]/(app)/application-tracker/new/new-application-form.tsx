"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
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
  resumeOptions: ComboboxOption[];
  coverLetterOptions: ComboboxOption[];
}

export function NewApplicationForm({ resumeOptions, coverLetterOptions }: NewApplicationFormProps) {
  const t = useTranslations("applicationTracker.new");
  const tStages = useTranslations("applicationTracker.stages");
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [stage, setStage] = useState("APPLIED");
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
      router.push(`/application-tracker/${result.token}`);
    });
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="companyName">{t("companyLabel")}</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="positionTitle">{t("positionLabel")}</Label>
          <Input
            id="positionTitle"
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("stageLabel")}</Label>
        <Combobox
          value={stage}
          onChange={setStage}
          options={STAGES.map((value) => ({ value, label: tStages(value) }))}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jobUrl">{t("jobUrlLabel")}</Label>
          <Input id="jobUrl" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">{t("locationLabel")}</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("resumeLabel")}</Label>
          <Combobox
            value={resumeDocumentId}
            onChange={setResumeDocumentId}
            options={[{ value: "", label: t("resumeNone") }, ...resumeOptions]}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{t("coverLetterLabel")}</Label>
          <Combobox
            value={coverLetterId}
            onChange={setCoverLetterId}
            options={[{ value: "", label: t("coverLetterNone") }, ...coverLetterOptions]}
          />
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={!canSubmit || isPending} onClick={handleSubmit}>
        {t("submit")}
      </Button>
    </div>
  );
}
