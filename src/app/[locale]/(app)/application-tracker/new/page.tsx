import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { parseStageParam } from "@/lib/application-tracker/parse-stage-param";
import { ApplicationTrackerBoard } from "@/components/application-tracker/application-tracker-board";
import { NewApplicationSheet } from "@/components/application-tracker/new-application-sheet";

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialStage = parseStageParam(params.stage);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [resumes, coverLetters] = await Promise.all([
    db.resumeDocument.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    db.coverLetter.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, companyName: true, positionTitle: true },
    }),
  ]);

  return (
    <>
      <ApplicationTrackerBoard />
      <NewApplicationSheet
        closeMode="replace"
        initialStage={initialStage}
        resumeOptions={resumes.map((resume) => ({ value: resume.id, label: resume.title }))}
        coverLetterOptions={coverLetters.map((letter) => ({
          value: letter.id,
          label: `${letter.companyName} — ${letter.positionTitle}`,
        }))}
      />
    </>
  );
}
