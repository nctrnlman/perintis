import { CalendarPlus, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AtsCheckAggregateStats } from "@/lib/resume/ats-stats";

export function AtsCheckStatsRow({ stats }: { stats: AtsCheckAggregateStats }) {
  const t = useTranslations("ats.list.stats");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ShieldCheck className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums">{stats.total}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("total")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.excellentCount}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("excellentCount")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShieldQuestion className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            {stats.goodCount}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("goodCount")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
            <ShieldAlert className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums text-red-600 dark:text-red-400">
            {stats.needsWorkCount}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("needsWorkCount")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CalendarPlus className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums">{stats.addedThisWeek}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("addedThisWeek")}</p>
      </div>
    </div>
  );
}
