import { CalendarPlus, Mail, MessageSquareText } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CoverLetterAggregateStats } from "@/lib/cover-letter/stats";

export function CoverLetterStatsRow({ stats }: { stats: CoverLetterAggregateStats }) {
  const t = useTranslations("coverLetter.list.stats");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Mail className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums">{stats.total}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("total")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MessageSquareText className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums">{stats.formalCount}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("formalCount")}</p>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <MessageSquareText className="size-3.5" />
          </span>
          <p className="text-lg leading-none font-semibold tabular-nums">{stats.casualCount}</p>
        </div>
        <p className="truncate text-xs text-muted-foreground">{t("casualCount")}</p>
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
