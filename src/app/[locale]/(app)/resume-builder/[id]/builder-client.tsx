"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { updateResumeContent } from "@/app/[locale]/(app)/resume-builder/actions";
import { ContactInfoCard } from "@/components/resume-builder/contact-info-card";
import { SummaryCard } from "@/components/resume-builder/summary-card";

interface BuilderClientProps {
  id: string;
  token: string;
  initialTitle: string;
  initialContent: ResumeContent;
}

export function BuilderClient({ id, token, initialTitle, initialContent }: BuilderClientProps) {
  const t = useTranslations("resumeBuilder.builder");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateResumeContent(id, title, content);
      if ("error" in result) {
        toast.add({ title: t("toastSaveError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastSaveSuccess"), type: "success" });
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="rb-title">{t("titleLabel")}</Label>
          <Input id="rb-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>

      <ContactInfoCard
        personalInfo={content.personalInfo}
        onChange={(personalInfo) => setContent({ ...content, personalInfo })}
      />
      <SummaryCard
        summary={content.summary}
        onChange={(summary) => setContent({ ...content, summary })}
      />

      <div className="flex items-center justify-between rounded-2xl border border-border p-6">
        <div className="flex gap-3">
          <Button
            variant="outline"
            render={<a href={`/resume-builder/${token}/pdf`} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            {t("previewButton")}
          </Button>
          <Button
            variant="outline"
            render={<a href={`/resume-builder/${token}/pdf`} download={`${title}.pdf`} />}
            nativeButton={false}
          >
            {t("downloadButton")}
          </Button>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("saveButton")}
        </Button>
      </div>
    </div>
  );
}
