import { CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { ScoreRing } from "@/components/shared/score-ring";
import type { Finding, FindingSeverity } from "@/lib/resume/types";

const SEVERITY_ORDER: FindingSeverity[] = ["critical", "warning", "suggestion"];

const PDF_CHECK_CATEGORIES = ["multi-column-layout", "non-standard-font"];
const DOCX_CHECK_CATEGORIES = [
  "table-detected",
  "header-footer-content",
  "non-standard-font",
];

const CATEGORY_KEYS: Record<string, { strength: string; label: string }> = {
  "multi-column-layout": {
    strength: "strengthMultiColumnLayout",
    label: "categoryMultiColumnLayout",
  },
  "non-standard-font": {
    strength: "strengthNonStandardFont",
    label: "categoryNonStandardFont",
  },
  "table-detected": {
    strength: "strengthTableDetected",
    label: "categoryTableDetected",
  },
  "header-footer-content": {
    strength: "strengthHeaderFooterContent",
    label: "categoryHeaderFooterContent",
  },
};

function getTierKey(score: number): "tierExcellent" | "tierGood" | "tierNeedsWork" {
  if (score >= 90) return "tierExcellent";
  if (score >= 70) return "tierGood";
  return "tierNeedsWork";
}

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

  const isDocx = analysis.resume.filename?.toLowerCase().endsWith(".docx") ?? false;
  const applicableCategories = isDocx ? DOCX_CHECK_CATEGORIES : PDF_CHECK_CATEGORIES;
  const foundCategories = new Set(findings.map((f) => f.category));
  const strengths = applicableCategories.filter((cat) => !foundCategories.has(cat));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center rounded-2xl border border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">{t("scoreLabel")}</p>
        <div className="mt-4">
          <ScoreRing score={analysis.overallScore} />
        </div>
        <p className="mt-3 text-sm font-medium">{t(getTierKey(analysis.overallScore))}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("summary", { strengthCount: strengths.length, issueCount: findings.length })}
        </p>
      </div>

      {strengths.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold">{t("strengthsTitle")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {strengths.map((category) => (
              <div
                key={category}
                className="flex items-start gap-3 rounded-2xl border border-border p-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-500" />
                <p className="text-sm">{t(CATEGORY_KEYS[category].strength)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
                      {CATEGORY_KEYS[finding.category]
                        ? t(CATEGORY_KEYS[finding.category].label)
                        : finding.category}
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

        {!isDocx && (
          <p className="mt-6 text-xs text-muted-foreground">
            {t("pdfLimitationNote")}
          </p>
        )}
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
