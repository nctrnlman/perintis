import { Compass, Star, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CareerFitAggregateStats } from "@/lib/career-fit/stats";

export function CareerFitStatsRow({ stats }: { stats: CareerFitAggregateStats }) {
  const t = useTranslations("careerFit.stats");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Compass className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums">{stats.totalAnalyses}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("totalAnalyses")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Trophy className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.totalStrongMatches}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("totalStrongMatches")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Star className="size-3.5" />
          </span>
          <p className="truncate text-sm leading-none font-semibold">
            {stats.topRole ? stats.topRole.title : "—"}
          </p>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {stats.topRole
            ? t("topRoleHint", { count: stats.topRole.count })
            : t("noTopRole")}
        </p>
      </div>
    </div>
  );
}
