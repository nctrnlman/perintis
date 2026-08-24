import { useTranslations } from "next-intl";
import type { ApplicationStats } from "@/lib/application-tracker/stats";

export function ApplicationStatsRow({ stats }: { stats: ApplicationStats }) {
  const t = useTranslations("applicationTracker.stats");

  const items = [
    { label: t("total"), value: String(stats.total) },
    { label: t("activePipeline"), value: String(stats.activePipeline) },
    {
      label: t("winRate"),
      value: stats.winRate === null ? t("notEnoughData") : `${stats.winRate}%`,
    },
    {
      label: t("interviewConversion"),
      value:
        stats.interviewConversion === null ? t("notEnoughData") : `${stats.interviewConversion}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border p-4">
          <p className="text-2xl font-semibold tabular-nums">{item.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
