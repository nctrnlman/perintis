import { Compass } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { CareerFitAggregateStats } from "@/lib/career-fit/stats";
import { CareerFitStatsRow } from "@/components/career-fit/career-fit-stats-row";

export async function CareerFitInsightCard({ stats }: { stats: CareerFitAggregateStats }) {
  const t = await getTranslations("dashboard.insights");
  const tCareerFit = await getTranslations("careerFit");

  return (
    <div className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Compass className="size-4" />
          </span>
          <h2 className="text-sm font-semibold">{tCareerFit("title")}</h2>
        </div>
        <Link href="/career-fit" className="text-xs font-medium text-primary hover:underline">
          {t("seeAll")} &rarr;
        </Link>
      </div>
      <div className="mt-4">
        <CareerFitStatsRow stats={stats} />
      </div>
    </div>
  );
}
