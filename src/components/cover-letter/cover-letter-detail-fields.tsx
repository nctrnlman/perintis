"use client";

import { useCallback, useState, useTransition } from "react";
import { FileDown, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";
import { SaveStatus } from "@/components/profile/save-status";
import { RequiredMark } from "@/components/shared/property-row";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { trackEvent } from "@/lib/analytics-events";
import { deleteCoverLetter, updateCoverLetterFields } from "@/app/[locale]/(app)/cover-letter/actions";

export interface CoverLetterDetailFieldsProps {
  id: string;
  token: string;
  initialCompanyName: string;
  initialPositionTitle: string;
  initialBodyHtml: string;
  onDeleted?: () => void;
}

export function CoverLetterDetailFields({
  id,
  token,
  initialCompanyName,
  initialPositionTitle,
  initialBodyHtml,
  onDeleted,
}: CoverLetterDetailFieldsProps) {
  const t = useTranslations("coverLetter.editor");
  const router = useRouter();
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [isDeleting, startDeleteTransition] = useTransition();

  const save = useCallback((formData: FormData) => updateCoverLetterFields(id, formData), [id]);
  const { formRef, status, handleChange } = useAutoSaveForm(save);

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCoverLetter(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      trackEvent("cover_letter_deleted");
      if (onDeleted) {
        onDeleted();
      } else {
        router.push("/cover-letter");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} onChange={handleChange} className="space-y-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-0.5">
              <label htmlFor="companyName" className="text-xs text-muted-foreground">
                {t("companyLabel")} <RequiredMark />
              </label>
              <input
                id="companyName"
                name="companyName"
                defaultValue={initialCompanyName}
                className="w-full truncate bg-transparent text-lg font-semibold outline-none placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="space-y-0.5">
              <label htmlFor="positionTitle" className="text-xs text-muted-foreground">
                {t("positionLabel")} <RequiredMark />
              </label>
              <input
                id="positionTitle"
                name="positionTitle"
                defaultValue={initialPositionTitle}
                className="w-full truncate bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <SaveStatus status={status} namespace="coverLetter" />
        </div>

        <div className="pt-4">
          <p className="text-sm text-muted-foreground">{t("bodyLabel")}</p>
          <div className="mt-1.5">
            <RichTextEditor
              value={bodyHtml}
              onChange={(html) => {
                setBodyHtml(html);
                handleChange();
              }}
              boldLabel={t("boldLabel")}
              italicLabel={t("italicLabel")}
              bulletListLabel={t("bulletListLabel")}
              orderedListLabel={t("orderedListLabel")}
              strikeLabel={t("strikeLabel")}
              codeLabel={t("codeLabel")}
              horizontalRuleLabel={t("horizontalRuleLabel")}
              allowExtendedFormatting
            />
            <input type="hidden" name="bodyHtml" value={bodyHtml} readOnly />
          </div>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <a
                href={`/cover-letter/${token}/pdf`}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("cover_letter_export", { format: "pdf" })}
              />
            }
            nativeButton={false}
          >
            <FileDown className="size-4" />
            {t("downloadPdfButton")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={
              <a
                href={`/cover-letter/${token}/docx`}
                download
                onClick={() => trackEvent("cover_letter_export", { format: "word" })}
              />
            }
            nativeButton={false}
          >
            <FileDown className="size-4" />
            {t("downloadWordButton")}
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
          <Trash2 className="size-4" />
          {t("deleteButton")}
        </Button>
      </div>
    </div>
  );
}
