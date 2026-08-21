"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";
import { SaveStatus } from "@/components/profile/save-status";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { deleteCoverLetter, updateCoverLetterFields } from "../actions";

interface CoverLetterEditorClientProps {
  id: string;
  token: string;
  initialCompanyName: string;
  initialPositionTitle: string;
  initialBodyHtml: string;
}

export function CoverLetterEditorClient({
  id,
  token,
  initialCompanyName,
  initialPositionTitle,
  initialBodyHtml,
}: CoverLetterEditorClientProps) {
  const t = useTranslations("coverLetter.editor");
  const router = useRouter();
  const [bodyHtml, setBodyHtml] = useState(initialBodyHtml);
  const [isDeleting, startDeleteTransition] = useTransition();

  const save = useCallback(
    (formData: FormData) => updateCoverLetterFields(id, formData),
    [id]
  );
  const { formRef, status, handleChange } = useAutoSaveForm(save);

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCoverLetter(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      router.push("/cover-letter");
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/cover-letter" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
      </div>

      <div className="rounded-2xl border border-border p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("detailsTitle")}</h2>
          <SaveStatus status={status} namespace="coverLetter" />
        </div>

        <form ref={formRef} onChange={handleChange} className="mt-6 space-y-6">
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
            <Label>{t("bodyLabel")}</Label>
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
        </form>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border p-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            render={<a href={`/cover-letter/${token}/pdf`} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            {t("downloadPdfButton")}
          </Button>
          <Button
            variant="outline"
            render={<a href={`/cover-letter/${token}/docx`} download />}
            nativeButton={false}
          >
            {t("downloadWordButton")}
          </Button>
        </div>
        <Button variant="ghost" onClick={handleDelete} disabled={isDeleting}>
          {t("deleteButton")}
        </Button>
      </div>
    </div>
  );
}
