"use client";

import { useTranslations } from "next-intl";

interface SummaryCardProps {
  summary: string;
  onChange: (summary: string) => void;
}

export function SummaryCard({ summary, onChange }: SummaryCardProps) {
  const t = useTranslations("resumeBuilder.builder");

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("summaryTitle")}</h2>
      <textarea
        value={summary}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="mt-4 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    </div>
  );
}
