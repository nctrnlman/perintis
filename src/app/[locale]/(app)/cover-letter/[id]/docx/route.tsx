import { notFound } from "next/navigation";
import { Packer } from "docx";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import { buildCoverLetterDocx } from "@/lib/cover-letter/docx-template";

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

  const document = buildCoverLetterDocx({
    companyName: coverLetter.companyName,
    createdAt: coverLetter.createdAt,
    bodyHtml: coverLetter.bodyHtml,
    fullName: profile?.fullName ?? null,
    email: user.email ?? null,
    phone: profile?.phone ?? null,
    linkedinUrl: profile?.linkedinUrl ?? null,
    location: profile?.location ?? null,
  });

  const buffer = await Packer.toBuffer(document);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `inline; filename="${coverLetter.companyName}-cover-letter.docx"`,
    },
  });
}
