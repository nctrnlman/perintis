import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { AtsCheckListBoard } from "@/components/ats-check/ats-check-list-board";
import { AtsCheckDetailSheet } from "@/components/ats-check/ats-check-detail-sheet";
import { AtsCheckResultView } from "@/components/ats-check/ats-check-result-view";
import type { KeywordMatchResult } from "@/lib/resume/match-keywords";
import type { ResumeKeywords } from "@/lib/resume/extract-keywords";
import type { Finding } from "@/lib/resume/types";

export default async function AtsCheckResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;

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

  const previousAnalysis = await db.aTSCheckAnalysis.findFirst({
    where: { userId: user.id, createdAt: { lt: analysis.createdAt } },
    orderBy: { createdAt: "desc" },
    select: { overallScore: true },
  });

  const isDocx = analysis.resume.filename?.toLowerCase().endsWith(".docx") ?? false;

  return (
    <>
      <AtsCheckListBoard />
      <AtsCheckDetailSheet closeMode="replace">
        <AtsCheckResultView
          id={analysis.id}
          filename={analysis.resume.filename}
          createdAt={analysis.createdAt}
          overallScore={analysis.overallScore}
          previousScore={previousAnalysis?.overallScore ?? null}
          isDocx={isDocx}
          jobPostingText={analysis.jobPostingText}
          structuralFindings={analysis.structuralFindings as unknown as Finding[]}
          contentFindings={(analysis.contentFindings as unknown as Finding[] | null) ?? []}
          keywordMatch={analysis.keywordFindings as unknown as KeywordMatchResult | null}
          resumeKeywords={analysis.resumeKeywords as unknown as ResumeKeywords | null}
        />
      </AtsCheckDetailSheet>
    </>
  );
}
