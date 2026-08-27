import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { CoverLetterDetailSheet } from "@/components/cover-letter/cover-letter-detail-sheet";

export default async function CoverLetterDetailModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: token } = await params;
  const coverLetterId = decryptId(token);
  if (!coverLetterId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });
  if (!coverLetter || coverLetter.userId !== user.id) notFound();

  return (
    <CoverLetterDetailSheet
      id={coverLetter.id}
      token={token}
      initialCompanyName={coverLetter.companyName}
      initialPositionTitle={coverLetter.positionTitle}
      initialBodyHtml={coverLetter.bodyHtml}
    />
  );
}
