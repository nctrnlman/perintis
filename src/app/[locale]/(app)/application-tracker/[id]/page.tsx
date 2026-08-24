import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { ApplicationEditorClient } from "./application-editor-client";

export default async function ApplicationEditorPage({
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
    <ApplicationEditorClient
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
      resumeOptions={resumes.map((resume) => ({ value: resume.id, label: resume.title }))}
      coverLetterOptions={coverLetters.map((letter) => ({
        value: letter.id,
        label: `${letter.companyName} — ${letter.positionTitle}`,
      }))}
      rounds={application.interviewRounds}
    />
  );
}
