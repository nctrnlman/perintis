import { useTranslations } from "next-intl";
import { ScoreRing } from "@/components/shared/score-ring";

interface ProfileCompletenessCardProps {
  percentage: number;
  missing: string[];
}

export function ProfileCompletenessCard({ percentage, missing }: ProfileCompletenessCardProps) {
  const t = useTranslations("dashboard.profileCompleteness");

  return (
    <div className="rounded-2xl border border-border p-6">
      <div className="flex items-center gap-5">
        <ScoreRing score={percentage} size={64} suffix="%" />
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {missing.length > 0 ? t("missingIntro") : t("complete")}
          </p>
        </div>
      </div>

      {missing.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
          {missing.map((key) => (
            <li
              key={key}
              className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
            >
              {t(`items.${key}`)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
