"use client";

import { useTranslations } from "next-intl";
import { RichTextarea } from "@/components/resume-builder/rich-textarea";

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
        <RichTextarea value={summary} onChange={onChange} rows={4} boldLabel={t("boldLabel")} />
      </div>
    </div>
  );
}
