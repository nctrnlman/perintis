import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { CareerFitListBoard } from "@/components/career-fit/career-fit-list-board";
import { CareerFitDetailSheet } from "@/components/career-fit/career-fit-detail-sheet";
import type { CareerFitResult } from "@/components/career-fit/career-fit-result-card";

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

  return (
    <>
      <CareerFitListBoard />
      <CareerFitDetailSheet
        closeMode="replace"
        id={analysis.id}
        createdAt={analysis.createdAt}
        results={analysis.results as unknown as CareerFitResult[]}
      />
    </>
  );
}
