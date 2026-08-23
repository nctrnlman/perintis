"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/shared/upload-dropzone";
import { toast } from "@/components/ui/toast";
import { uploadAndAnalyzeResume } from "../actions";
import { trackEvent } from "@/lib/analytics-events";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ERROR_KEYS = {
  "unsupported-type": "errorUnsupportedType",
  "too-large": "errorTooLarge",
  "parsing-failed": "errorParsing",
} as const;

export default function NewAtsCheckPage() {
  const t = useTranslations("ats.upload");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobPostingText, setJobPostingText] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleFileSelected(selected: File) {
    if (selected.size > MAX_FILE_SIZE) {
      toast.add({ title: t("errorTooLarge"), type: "error" });
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function analyzeResume(selectedFile: File) {
    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("jobPostingText", jobPostingText);
    const result = await uploadAndAnalyzeResume(formData);

    if ("error" in result) {
      trackEvent("ats_check_failed", { error: result.error });
      const key = ERROR_KEYS[result.error as keyof typeof ERROR_KEYS] ?? "errorGeneric";
      throw new Error(t(key));
    }

    return result;
  }

  function handleSubmit() {
    if (!file) return;
    const selectedFile = file;

    startTransition(async () => {
      try {
        const result = await toast.promise(analyzeResume(selectedFile), {
          loading: t("analyzing"),
          success: t("toastSuccessTitle"),
          error: (err: Error) => ({
            title: t("toastErrorTitle"),
            description: err.message,
          }),
        });

        if (result.jobMatchFailed) {
          toast.add({ title: t("toastJobMatchFailed"), type: "warning" });
        }
        if (result.keywordExtractionFailed) {
          toast.add({ title: t("toastKeywordExtractionFailed"), type: "warning" });
        }

        trackEvent("ats_check_completed", { has_job_posting: Boolean(jobPostingText.trim()) });
        router.push(`/ats-check/${result.token}`);
      } catch {
        // toast.promise already surfaced the error toast
      }
    });
  }

  return (
    <Reveal className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <div className="mt-8">
        <UploadDropzone
          accept=".pdf,.docx"
          maxSizeBytes={MAX_FILE_SIZE}
          onFileSelected={handleFileSelected}
          label={t("dropzoneLabel")}
          hint={t("dropzoneHint")}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-background">
            <Briefcase className="size-3.5 text-muted-foreground" />
          </span>
          <label htmlFor="jobPostingText" className="text-sm font-medium">
            {t("jobPostingLabel")}
          </label>
        </div>
        <Textarea
          id="jobPostingText"
          value={jobPostingText}
          onChange={(e) => setJobPostingText(e.target.value)}
          placeholder={t("jobPostingPlaceholder")}
          rows={6}
          className="rounded-none border-none bg-transparent px-5 py-4 shadow-none focus-visible:ring-0"
        />
        <p className="border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
          {t("jobPostingHint")}
        </p>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!file || isPending}
        onClick={handleSubmit}
      >
        {t("submit")}
      </Button>
    </Reveal>
  );
}
