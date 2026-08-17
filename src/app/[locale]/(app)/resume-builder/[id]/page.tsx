import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { BuilderClient } from "./builder-client";

export default async function ResumeBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;

  const resumeDocumentId = decryptId(token);
  if (!resumeDocumentId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const resumeDocument = await db.resumeDocument.findUnique({
    where: { id: resumeDocumentId },
  });

  if (!resumeDocument || resumeDocument.userId !== user.id) {
    notFound();
  }

  return (
    <BuilderClient
      id={resumeDocument.id}
      token={token}
      initialTitle={resumeDocument.title}
      initialContent={resumeDocument.content as unknown as ResumeContent}
    />
  );
}
