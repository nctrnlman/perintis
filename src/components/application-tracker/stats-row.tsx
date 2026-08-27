import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  Briefcase,
  CalendarPlus,
  MessagesSquare,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ApplicationStats } from "@/lib/application-tracker/stats";
import { getStageColor } from "@/lib/application-tracker/stage-colors";

const STAGE_ORDER = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string;
  title?: string;
  warn?: boolean;
}

export function ApplicationStatsRow({ stats }: { stats: ApplicationStats }) {
  const t = useTranslations("applicationTracker.stats");
  const tStages = useTranslations("applicationTracker.stages");

  const items: StatItem[] = [
    { icon: Briefcase, label: t("total"), value: String(stats.total) },
    { icon: Zap, label: t("activePipeline"), value: String(stats.activePipeline) },
    {
      icon: Trophy,
      label: t("winRate"),
      value: stats.winRate === null ? "—" : `${stats.winRate}%`,
      title: stats.winRate === null ? t("notEnoughData") : undefined,
    },
    {
      icon: MessagesSquare,
      label: t("interviewConversion"),
      value: stats.interviewConversion === null ? "—" : `${stats.interviewConversion}%`,
      title: stats.interviewConversion === null ? t("notEnoughData") : undefined,
    },
    { icon: CalendarPlus, label: t("addedThisWeek"), value: String(stats.addedThisWeek) },
    {
      icon: AlertTriangle,
      label: t("staleCount"),
      value: String(stats.staleCount),
      title: stats.staleCount > 0 ? t("staleCountHint") : undefined,
      warn: stats.staleCount > 0,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              title={item.title}
              className="flex flex-col gap-1.5 rounded-xl border border-border p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                    item.warn
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                </span>
                <p
                  className={`text-lg leading-none font-semibold tabular-nums ${
                    item.warn ? "text-amber-600 dark:text-amber-400" : ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border p-3">
        <p className="text-xs font-medium text-muted-foreground">{t("byStageTitle")}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STAGE_ORDER.map((stage) => (
            <span
              key={stage}
              className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
            >
              <span className={`size-1.5 shrink-0 rounded-full ${getStageColor(stage).dot}`} />
              {tStages(stage)}
              <span className="font-medium tabular-nums">{stats.perStage[stage]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
