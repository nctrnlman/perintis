import { useTranslations } from "next-intl";

export interface CareerFitResult {
  roleId: string;
  title: string;
  category: string;
  tier: "STRONG" | "GOOD" | "WORTH_EXPLORING";
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export const TIER_STYLES: Record<CareerFitResult["tier"], string> = {
  STRONG: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  GOOD: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WORTH_EXPLORING: "bg-muted text-muted-foreground",
};

export const TIER_DOT_STYLES: Record<CareerFitResult["tier"], string> = {
  STRONG: "bg-emerald-500",
  GOOD: "bg-blue-500",
  WORTH_EXPLORING: "bg-muted-foreground/40",
};

export function TierBadge({ tier }: { tier: CareerFitResult["tier"] }) {
  const t = useTranslations("careerFit.tiers");
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[tier]}`}>
      {t(tier)}
    </span>
  );
}

const TIER_ORDER: CareerFitResult["tier"][] = ["STRONG", "GOOD", "WORTH_EXPLORING"];

export function TierBreakdown({ results }: { results: Pick<CareerFitResult, "tier">[] }) {
  const t = useTranslations("careerFit.tiers");
  const counts = TIER_ORDER.map((tier) => ({
    tier,
    count: results.filter((result) => result.tier === tier).length,
  })).filter((entry) => entry.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {counts.map(({ tier, count }) => (
        <span key={tier} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`size-1.5 shrink-0 rounded-full ${TIER_DOT_STYLES[tier]}`} />
          {count} {t(tier)}
        </span>
      ))}
    </div>
  );
}

export function CareerFitResultCard({ result }: { result: CareerFitResult }) {
  const t = useTranslations("careerFit.detail");

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{result.title}</h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {result.category}
        </span>
        <TierBadge tier={result.tier} />
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{result.reasoning}</p>
      {result.matchedSkills.length > 0 && (
        <div className="mt-3.5">
          <p className="text-xs font-medium text-muted-foreground">{t("matchedSkillsLabel")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.matchedSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      {result.missingSkills.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">{t("missingSkillsLabel")}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {result.missingSkills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
