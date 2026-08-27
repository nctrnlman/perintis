import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId, encryptId } from "@/lib/id-crypto";
import { ApplicationTrackerBoard } from "@/components/application-tracker/application-tracker-board";
import { ApplicationDetailSheet } from "@/components/application-tracker/application-detail-sheet";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const applicationId = decryptId(token);
  if (!applicationId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [application, resumes, coverLetters] = await Promise.all([
    db.application.findUnique({
      where: { id: applicationId },
      include: { interviewRounds: { orderBy: { createdAt: "asc" } } },
    }),
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

  if (!application || application.userId !== user.id) notFound();

  return (
    <>
      <ApplicationTrackerBoard />
      <ApplicationDetailSheet
        closeMode="replace"
        id={application.id}
        initialCompanyName={application.companyName}
        initialPositionTitle={application.positionTitle}
        initialStage={application.stage}
        initialJobUrl={application.jobUrl ?? ""}
        initialLocation={application.location ?? ""}
        initialNotes={application.notes ?? ""}
        initialAppliedAt={application.appliedAt ? application.appliedAt.toISOString().slice(0, 10) : ""}
        initialResumeDocumentId={application.resumeDocumentId ?? ""}
        initialCoverLetterId={application.coverLetterId ?? ""}
        resumeOptions={resumes.map((resume) => ({
          value: resume.id,
          label: resume.title,
          token: encryptId(resume.id),
        }))}
        coverLetterOptions={coverLetters.map((letter) => ({
          value: letter.id,
          label: `${letter.companyName} — ${letter.positionTitle}`,
          token: encryptId(letter.id),
        }))}
        rounds={application.interviewRounds}
      />
    </>
  );
}
