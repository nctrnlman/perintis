"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/shared/reveal";
import { toast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";
import { stripHtml } from "@/lib/resume-builder/strip-html";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-events";
import { generateCoverLetter } from "../actions";

type Tone = "formal" | "casual";
type Length = "short" | "standard";

export default function NewCoverLetterPage() {
  const t = useTranslations("coverLetter.new");
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [positionTitle, setPositionTitle] = useState("");
  const [jobPostingText, setJobPostingText] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [length, setLength] = useState<Length>("standard");
  const [isPending, startTransition] = useTransition();

  const canSubmit = Boolean(
    companyName.trim() && positionTitle.trim() && stripHtml(jobPostingText).trim()
  );

  function toggleClass(active: boolean) {
    return cn(
      "rounded-full border px-4 py-1.5 text-sm transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border text-muted-foreground hover:text-foreground"
    );
  }

  async function generate() {
    const formData = new FormData();
    formData.set("companyName", companyName);
    formData.set("positionTitle", positionTitle);
    formData.set("jobPostingText", jobPostingText);
    formData.set("tone", tone);
    formData.set("length", length);

    const result = await generateCoverLetter(formData);
    if ("error" in result) {
      trackEvent("generate_cover_letter_failed", { error: result.error });
      throw new Error(t("toastGenerateError"));
    }
    return result;
  }

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      try {
        const result = await toast.promise(generate(), {
          loading: t("generating"),
          success: t("toastGenerateSuccess"),
          error: (err: Error) => ({
            title: t("toastGenerateErrorTitle"),
            description: err.message,
          }),
        });
        trackEvent("generate_cover_letter", { tone, length });
        router.push(`/cover-letter/${result.token}`);
      } catch {
        // toast.promise already surfaced the error toast
      }
    });
  }

  return (
    <Reveal className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

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
          <Label>{t("jobPostingLabel")}</Label>
          <RichTextEditor
            value={jobPostingText}
            onChange={setJobPostingText}
            placeholder={t("jobPostingPlaceholder")}
            boldLabel={t("boldLabel")}
            italicLabel={t("italicLabel")}
            bulletListLabel={t("bulletListLabel")}
            orderedListLabel={t("orderedListLabel")}
            strikeLabel={t("strikeLabel")}
            codeLabel={t("codeLabel")}
            horizontalRuleLabel={t("horizontalRuleLabel")}
            allowExtendedFormatting
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("toneLabel")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={toggleClass(tone === "formal")}
                onClick={() => setTone("formal")}
              >
                {t("toneFormal")}
              </button>
              <button
                type="button"
                className={toggleClass(tone === "casual")}
                onClick={() => setTone("casual")}
              >
                {t("toneCasual")}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("lengthLabel")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                className={toggleClass(length === "short")}
                onClick={() => setLength("short")}
              >
                {t("lengthShort")}
              </button>
              <button
                type="button"
                className={toggleClass(length === "standard")}
                onClick={() => setLength("standard")}
              >
                {t("lengthStandard")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!canSubmit || isPending}
        onClick={handleSubmit}
      >
        {t("submit")}
      </Button>
    </Reveal>
  );
}
