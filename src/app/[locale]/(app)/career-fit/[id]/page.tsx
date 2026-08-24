import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { DeletePotentialAnalysisButton } from "@/components/career-fit/delete-potential-analysis-button";

interface CareerFitResult {
  roleId: string;
  title: string;
  category: string;
  tier: "STRONG" | "GOOD" | "WORTH_EXPLORING";
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

const TIER_STYLES: Record<CareerFitResult["tier"], string> = {
  STRONG: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  GOOD: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WORTH_EXPLORING: "bg-muted text-muted-foreground",
};

export default async function CareerFitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const analysisId = decryptId(token);
  if (!analysisId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const analysis = await db.potentialAnalysis.findUnique({ where: { id: analysisId } });
  if (!analysis || analysis.userId !== user.id) notFound();

  const t = await getTranslations("careerFit.detail");
  const tTiers = await getTranslations("careerFit.tiers");
  const results = analysis.results as unknown as CareerFitResult[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/career-fit" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <DeletePotentialAnalysisButton id={analysis.id} />
      </div>

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.roleId} className="rounded-2xl border border-border p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{result.title}</h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                {result.category}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[result.tier]}`}
              >
                {tTiers(result.tier)}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.reasoning}
            </p>
            {result.matchedSkills.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("matchedSkillsLabel")}
                </p>
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
                <p className="text-xs font-medium text-muted-foreground">
                  {t("missingSkillsLabel")}
                </p>
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
        ))}
      </div>
    </div>
  );
}
