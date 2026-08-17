import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { decryptId } from "@/lib/id-crypto";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { ResumePdfDocument } from "@/lib/resume-builder/pdf-template";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const content = resumeDocument.content as unknown as ResumeContent;
  const buffer = await renderToBuffer(<ResumePdfDocument content={content} />);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resumeDocument.title}.pdf"`,
    },
  });
}
