import { ListChecks } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ApplicationStats } from "@/lib/application-tracker/stats";
import { ApplicationStatsRow } from "@/components/application-tracker/stats-row";

export async function ApplicationTrackerInsightCard({ stats }: { stats: ApplicationStats }) {
  const t = await getTranslations("dashboard.insights");
  const tApp = await getTranslations("applicationTracker");

  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ListChecks className="size-4" />
          </span>
          <h2 className="text-sm font-semibold">{tApp("title")}</h2>
        </div>
        <Link href="/application-tracker" className="text-xs font-medium text-primary hover:underline">
          {t("seeAll")} &rarr;
        </Link>
      </div>
      <div className="mt-4">
        <ApplicationStatsRow stats={stats} compact />
      </div>
    </div>
  );
}
