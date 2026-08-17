"use client";

import { useTranslations } from "next-intl";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";

interface SummaryCardProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryCard({ summary, onChange }: SummaryCardProps) {
  const t = useTranslations("resumeBuilder.builder");

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("summaryTitle")}</h2>
      <div className="mt-4">
        <RichTextEditor
          value={summary}
          onChange={onChange}
          boldLabel={t("boldLabel")}
          italicLabel={t("italicLabel")}
        />
      </div>
    </div>
  );
}
