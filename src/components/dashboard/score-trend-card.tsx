import { TrendingDown, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getScoreTier, type ScoreTier } from "@/lib/resume/scoring";
import { buildTrendPath, computeTrendDelta } from "@/lib/dashboard/score-trend";

interface ScoreTrendCardProps {
  scores: number[];
  resumeCount: number;
  coverLetterCount: number;
}

const TIER_TEXT_COLOR: Record<ScoreTier, string> = {
  excellent: "text-emerald-500",
  good: "text-amber-500",
  needsWork: "text-red-500",
};

const TIER_STROKE_COLOR: Record<ScoreTier, string> = {
  excellent: "stroke-emerald-500",
  good: "stroke-amber-500",
  needsWork: "stroke-red-500",
};

const CHART_WIDTH = 240;
const CHART_HEIGHT = 64;

export function ScoreTrendCard({ scores, resumeCount, coverLetterCount }: ScoreTrendCardProps) {
  const t = useTranslations("dashboard.scoreTrend");
  const tModuleStatus = useTranslations("dashboard.moduleStatus");

  if (scores.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border p-6">
        <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
        <div className="mt-4 flex flex-1 flex-col items-start justify-center">
          <p className="font-semibold">{t("emptyTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          <Link
            href="/ats-check/new"
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            {t("emptyCta")} &rarr;
          </Link>
        </div>
      </div>
    );
  }

  const latest = scores[scores.length - 1];
  const delta = computeTrendDelta(scores);
  const tier = getScoreTier(latest);
  const path = buildTrendPath(scores, CHART_WIDTH, CHART_HEIGHT, 6);
  const areaPath = `${path} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;
  const lastPointX = CHART_WIDTH;
  const lastPointY = Number(path.slice(path.lastIndexOf(",") + 1));

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground">{t("title")}</h2>
          <p className="mt-1 flex items-baseline gap-1">
            <span className={`text-4xl font-semibold tabular-nums ${TIER_TEXT_COLOR[tier]}`}>
              {latest}
            </span>
            <span className="text-sm text-muted-foreground">{t("latestLabel")}</span>
          </p>
        </div>
        {delta !== null ? (
          <span
            className={`flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium ${
              delta > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : delta < 0
                  ? "text-red-500"
                  : "text-muted-foreground"
            }`}
          >
            {delta > 0 && <TrendingUp className="size-3.5" />}
            {delta < 0 && <TrendingDown className="size-3.5" />}
            {delta === 0 ? t("same") : t(delta > 0 ? "up" : "down", { points: Math.abs(delta) })}
          </span>
        ) : (
          <span className="max-w-[8rem] text-right text-xs text-muted-foreground">
            {t("singleCheckHint")}
          </span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="mt-4 h-16 w-full"
      >
        <defs>
          <linearGradient id="score-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#score-trend-fill)" className={TIER_TEXT_COLOR[tier]} />
        <path
          d={path}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={TIER_STROKE_COLOR[tier]}
        />
        <circle cx={lastPointX} cy={lastPointY} r={3} className={`fill-current ${TIER_TEXT_COLOR[tier]}`} />
      </svg>

      <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
        {tModuleStatus("resumesCreated", { count: resumeCount })}
        {" · "}
        {tModuleStatus("coverLettersCreated", { count: coverLetterCount })}
      </p>
    </div>
  );
}
