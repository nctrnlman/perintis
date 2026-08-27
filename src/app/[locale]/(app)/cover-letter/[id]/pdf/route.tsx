import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { CoverLetterPdfDocument } from "@/lib/cover-letter/pdf-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: token } = await params;

  const coverLetterId = decryptId(token);
  if (!coverLetterId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });

  if (!coverLetter || coverLetter.userId !== user.id) {
    notFound();
  }

  const profile = await db.profile.findUnique({ where: { userId: user.id } });

  const buffer = await renderToBuffer(
    <CoverLetterPdfDocument
      companyName={coverLetter.companyName}
      createdAt={coverLetter.createdAt}
      bodyHtml={coverLetter.bodyHtml}
      fullName={profile?.fullName ?? null}
      email={user.email ?? null}
      phone={profile?.phone ?? null}
      linkedinUrl={profile?.linkedinUrl ?? null}
      location={profile?.location ?? null}
    />
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${coverLetter.companyName}-cover-letter.pdf"`,
    },
  });
}
