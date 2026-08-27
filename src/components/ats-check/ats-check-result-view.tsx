import { CheckCircle2, XCircle } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { ScoreRing } from "@/components/shared/score-ring";
import { DeleteCheckButton } from "@/components/ats-check/delete-check-button";
import { getScoreTier, type ScoreTier } from "@/lib/resume/scoring";
import type { KeywordMatchResult } from "@/lib/resume/match-keywords";
import type { ResumeKeywords } from "@/lib/resume/extract-keywords";
import type { Finding, FindingSeverity } from "@/lib/resume/types";

const SEVERITY_ORDER: FindingSeverity[] = ["critical", "warning", "suggestion"];

const PDF_STRUCTURAL_CATEGORIES = ["multi-column-layout", "non-standard-font"];
const DOCX_STRUCTURAL_CATEGORIES = ["table-detected", "header-footer-content", "non-standard-font"];
const CONTENT_CATEGORIES = [
  "missing-email",
  "missing-phone",
  "inconsistent-dates",
  "no-quantified-achievements",
  "weak-action-verbs",
];

const CATEGORY_KEYS: Record<string, { strength: string; label: string }> = {
  "multi-column-layout": { strength: "strengthMultiColumnLayout", label: "categoryMultiColumnLayout" },
  "non-standard-font": { strength: "strengthNonStandardFont", label: "categoryNonStandardFont" },
  "table-detected": { strength: "strengthTableDetected", label: "categoryTableDetected" },
  "header-footer-content": {
    strength: "strengthHeaderFooterContent",
    label: "categoryHeaderFooterContent",
  },
  "missing-email": { strength: "strengthEmailFound", label: "categoryMissingEmail" },
  "missing-phone": { strength: "strengthPhoneFound", label: "categoryMissingPhone" },
  "inconsistent-dates": { strength: "strengthConsistentDates", label: "categoryInconsistentDates" },
  "no-quantified-achievements": {
    strength: "strengthQuantifiedAchievements",
    label: "categoryNoQuantifiedAchievements",
  },
  "weak-action-verbs": { strength: "strengthStrongActionVerbs", label: "categoryWeakActionVerbs" },
};

const TIER_LABEL_KEYS: Record<ScoreTier, "tierExcellent" | "tierGood" | "tierNeedsWork"> = {
  excellent: "tierExcellent",
  good: "tierGood",
  needsWork: "tierNeedsWork",
};

const TIER_BADGE_CLASSES: Record<ScoreTier, string> = {
  excellent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  good: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  needsWork: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const KEYWORD_GROUPS: { key: keyof ResumeKeywords; label: string }[] = [
  { key: "technicalSkills", label: "categoryTechnicalSkills" },
  { key: "tools", label: "categoryTools" },
  { key: "certifications", label: "categoryCertifications" },
  { key: "softSkills", label: "categorySoftSkills" },
];

export interface AtsCheckResultViewProps {
  id: string;
  filename: string | null;
  createdAt: Date;
  overallScore: number;
  previousScore: number | null;
  isDocx: boolean;
  jobPostingText: string | null;
  structuralFindings: Finding[];
  contentFindings: Finding[];
  keywordMatch: KeywordMatchResult | null;
  resumeKeywords: ResumeKeywords | null;
}

export async function AtsCheckResultView({
  id,
  filename,
  createdAt,
  overallScore,
  previousScore,
  isDocx,
  jobPostingText,
  structuralFindings,
  contentFindings,
  keywordMatch,
  resumeKeywords,
}: AtsCheckResultViewProps) {
  const t = await getTranslations("ats.result");
  const format = await getFormatter();

  const severityLabels: Record<FindingSeverity, string> = {
    critical: t("severityCritical"),
    warning: t("severityWarning"),
    suggestion: t("severitySuggestion"),
  };

  const applicableStructuralCategories = isDocx ? DOCX_STRUCTURAL_CATEGORIES : PDF_STRUCTURAL_CATEGORIES;
  const applicableCategories = [...applicableStructuralCategories, ...CONTENT_CATEGORIES];
  const allFindings = [...structuralFindings, ...contentFindings];
  const foundCategories = new Set(allFindings.map((f) => f.category));
  const strengths = applicableCategories.filter((cat) => !foundCategories.has(cat));

  const scoreDelta = previousScore !== null ? overallScore - previousScore : null;
  const hasKeywords =
    resumeKeywords && KEYWORD_GROUPS.some((group) => resumeKeywords[group.key].length > 0);
  const tier = getScoreTier(overallScore);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{filename ?? "-"}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format.dateTime(createdAt, { dateStyle: "medium" })}
          </p>
        </div>
        <DeleteCheckButton id={id} />
      </div>

      <div className="mt-5 flex flex-col items-center rounded-2xl border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">{t("scoreLabel")}</p>
        <div className="mt-4">
          <ScoreRing score={overallScore} />
        </div>
        <span
          className={`mt-3 rounded-full px-3 py-1 text-xs font-medium ${TIER_BADGE_CLASSES[tier]}`}
        >
          {t(TIER_LABEL_KEYS[tier])}
        </span>
        {scoreDelta !== null && scoreDelta !== 0 && (
          <p
            className={`mt-2 text-xs font-medium ${scoreDelta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          >
            {scoreDelta > 0 ? "↑" : "↓"}{" "}
            {t("scoreHistoryChange", { delta: `${scoreDelta > 0 ? "+" : ""}${scoreDelta}` })}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {t("summary", { strengthCount: strengths.length, issueCount: allFindings.length })}
        </p>
      </div>

      {resumeKeywords && (
        <div className="mt-6">
          <h2 className="text-base font-semibold">{t("resumeKeywordsTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("resumeKeywordsSubtitle")}</p>
          <div className="mt-3 rounded-xl border border-border p-5">
            {hasKeywords ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {KEYWORD_GROUPS.map((group) => {
                  const items = resumeKeywords[group.key];
                  if (items.length === 0) return null;
                  return (
                    <div key={group.key}>
                      <p className="text-xs font-medium text-muted-foreground">{t(group.label)}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {items.map((keyword) => (
                          <span key={keyword} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noKeywordsFound")}</p>
            )}
          </div>
        </div>
      )}

      {jobPostingText && !keywordMatch && (
        <div className="mt-6">
          <h2 className="text-base font-semibold">{t("keywordMatchTitle")}</h2>
          <div className="mt-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            {t("keywordMatchUnavailable")}
          </div>
        </div>
      )}

      {keywordMatch && (
        <div className="mt-6">
          <h2 className="text-base font-semibold">{t("keywordMatchTitle")}</h2>
          <div className="mt-3 rounded-xl border border-border p-5">
            <div className="flex items-center gap-4">
              <ScoreRing score={keywordMatch.matchPercentage} size={64} suffix="%" />
              <p className="text-sm text-muted-foreground">
                {t("keywordMatchSummary", {
                  matched: keywordMatch.matchedKeywords.length,
                  total: keywordMatch.matchedKeywords.length + keywordMatch.missingKeywords.length,
                })}
              </p>
            </div>

            {(keywordMatch.matchedKeywords.length > 0 || keywordMatch.missingKeywords.length > 0) && (
              <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                    <XCircle className="size-3.5" />
                    {t("missingKeywordsTitle")}
                  </div>
                  {keywordMatch.missingKeywords.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {keywordMatch.missingKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs text-red-600 dark:text-red-400"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("noMissingKeywords")}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    {t("matchedKeywordsTitle")}
                  </div>
                  {keywordMatch.matchedKeywords.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {keywordMatch.matchedKeywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">{t("noMatchedKeywords")}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {strengths.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold">{t("strengthsTitle")}</h2>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {strengths.map((category) => (
              <div key={category} className="flex items-start gap-2.5 rounded-xl border border-border p-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <p className="text-sm">{t(CATEGORY_KEYS[category].strength)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-base font-semibold">{t("findingsTitle")}</h2>

        {structuralFindings.length === 0 ? (
          <p className="mt-3 text-muted-foreground">{t("noFindings")}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {[...structuralFindings]
              .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
              .map((finding, index) => (
                <div key={`${finding.category}-${index}`} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {CATEGORY_KEYS[finding.category] ? t(CATEGORY_KEYS[finding.category].label) : finding.category}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {severityLabels[finding.severity]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{finding.explanation}</p>
                  <p className="mt-2 text-sm">{finding.fixGuidance}</p>
                </div>
              ))}
          </div>
        )}

        {!isDocx && <p className="mt-4 text-xs text-muted-foreground">{t("pdfLimitationNote")}</p>}
      </div>

      {contentFindings.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold">{t("contentQualityTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("contentQualitySubtitle")}</p>
          <div className="mt-3 space-y-3">
            {[...contentFindings]
              .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
              .map((finding, index) => (
                <div key={`${finding.category}-${index}`} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {CATEGORY_KEYS[finding.category] ? t(CATEGORY_KEYS[finding.category].label) : finding.category}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {severityLabels[finding.severity]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{finding.explanation}</p>
                  <p className="mt-2 text-sm">{finding.fixGuidance}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
