import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { ScoreRing } from "@/components/shared/score-ring";
import type { Finding, FindingSeverity } from "@/lib/resume/types";

const SEVERITY_ORDER: FindingSeverity[] = ["critical", "warning", "suggestion"];

export default async function AtsCheckResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const t = await getTranslations("ats.result");

  const analysisId = decryptId(token);
  if (!analysisId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const analysis = await db.aTSCheckAnalysis.findUnique({
    where: { id: analysisId },
    include: { resume: true },
  });

  if (!analysis || analysis.userId !== user.id) {
    notFound();
  }

  const findings = analysis.structuralFindings as unknown as Finding[];
  const severityLabels: Record<FindingSeverity, string> = {
    critical: t("severityCritical"),
    warning: t("severityWarning"),
    suggestion: t("severitySuggestion"),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center rounded-2xl border border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">{t("scoreLabel")}</p>
        <div className="mt-4">
          <ScoreRing score={analysis.overallScore} />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">{t("findingsTitle")}</h2>

        {findings.length === 0 ? (
          <p className="mt-4 text-muted-foreground">{t("noFindings")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {[...findings]
              .sort(
                (a, b) =>
                  SEVERITY_ORDER.indexOf(a.severity) -
                  SEVERITY_ORDER.indexOf(b.severity)
              )
              .map((finding, index) => (
                <div
                  key={`${finding.category}-${index}`}
                  className="rounded-2xl border border-border p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {finding.category}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {severityLabels[finding.severity]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {finding.explanation}
                  </p>
                  <p className="mt-2 text-sm">{finding.fixGuidance}</p>
                </div>
              ))}
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          {t("pdfLimitationNote")}
        </p>
      </div>

      <Link
        href="/ats-check"
        className="mt-8 inline-block text-sm font-medium text-primary hover:underline"
      >
        {t("backToList")}
      </Link>
    </div>
  );
}
