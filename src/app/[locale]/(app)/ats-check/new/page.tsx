"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { UploadDropzone } from "@/components/shared/upload-dropzone";
import { uploadAndAnalyzeResume } from "../actions";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function NewAtsCheckPage() {
  const t = useTranslations("ats.upload");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileSelected(selected: File) {
    if (selected.size > MAX_FILE_SIZE) {
      setError(t("errorTooLarge"));
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  }

  function handleSubmit() {
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadAndAnalyzeResume(formData);

      if ("error" in result) {
        const key =
          result.error === "unsupported-type"
            ? "errorUnsupportedType"
            : result.error === "too-large"
              ? "errorTooLarge"
              : result.error === "parsing-failed"
                ? "errorParsing"
                : "errorGeneric";
        setError(t(key));
        return;
      }

      router.push(`/ats-check/${result.token}`);
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
          errorText={error}
        />
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!file || isPending}
        onClick={handleSubmit}
      >
        {isPending ? t("analyzing") : t("submit")}
      </Button>
    </Reveal>
  );
}
