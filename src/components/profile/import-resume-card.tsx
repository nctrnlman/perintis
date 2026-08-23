"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { UploadDropzone } from "@/components/shared/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/toast";
import { importResumeToProfile } from "@/app/[locale]/(app)/profile/import-actions";
import { trackEvent } from "@/lib/analytics-events";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ERROR_KEYS = {
  "too-large": "errorTooLarge",
  "unsupported-type": "errorUnsupportedType",
  "parsing-failed": "errorParsing",
  "extraction-failed": "errorExtraction",
} as const;

export function ImportResumeCard() {
  const t = useTranslations("profile.importResume");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileSelected(selected: File) {
    if (selected.size > MAX_FILE_SIZE) {
      toast.add({ title: t("errorTooLarge"), type: "error" });
      return;
    }
    setFile(selected);
  }

  async function runImport(selectedFile: File) {
    const formData = new FormData();
    formData.set("file", selectedFile);
    const result = await importResumeToProfile(formData);

    if ("error" in result) {
      trackEvent("profile_cv_import_failed", { error: result.error });
      const key = ERROR_KEYS[result.error as keyof typeof ERROR_KEYS] ?? "errorGeneric";
      throw new Error(t(key));
    }

    trackEvent("profile_cv_imported");
  }

  function handleSubmit() {
    if (!file) return;
    const selectedFile = file;

    startTransition(async () => {
      try {
        await toast.promise(runImport(selectedFile), {
          loading: t("analyzing"),
          success: t("toastSuccessTitle"),
          error: (err: Error) => ({ title: t("toastErrorTitle"), description: err.message }),
        });
        setFile(null);
        setOpen(false);
        router.refresh();
      } catch {
        // toast.promise already surfaced the error toast
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
        <Upload className="size-3.5" />
        {t("title")}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-5">
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("description")}</p>

        <div className="mt-4">
          <UploadDropzone
            accept=".pdf,.docx"
            maxSizeBytes={MAX_FILE_SIZE}
            onFileSelected={handleFileSelected}
            label={t("dropzoneLabel")}
            hint={t("dropzoneHint")}
          />
        </div>

        <Button
          className="mt-4 w-full"
          size="sm"
          disabled={!file || isPending}
          onClick={handleSubmit}
        >
          {t("submit")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
