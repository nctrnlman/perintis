"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { UploadDropzone } from "@/components/shared/upload-dropzone";
import { toast } from "@/components/ui/toast";
import { uploadAndAnalyzeResume } from "../actions";

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
    const result = await uploadAndAnalyzeResume(formData);

    if ("error" in result) {
      const key = ERROR_KEYS[result.error as keyof typeof ERROR_KEYS] ?? "errorGeneric";
      throw new Error(t(key));
    }

    return result.token;
  }

  function handleSubmit() {
    if (!file) return;
    const selectedFile = file;

    startTransition(async () => {
      try {
        const token = await toast.promise(analyzeResume(selectedFile), {
          loading: t("analyzing"),
          success: t("toastSuccessTitle"),
          error: (err: Error) => ({
            title: t("toastErrorTitle"),
            description: err.message,
          }),
        });
        router.push(`/ats-check/${token}`);
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
