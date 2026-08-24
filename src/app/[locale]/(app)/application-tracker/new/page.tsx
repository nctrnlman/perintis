import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { NewApplicationForm } from "./new-application-form";

export default async function NewApplicationPage() {
  const t = await getTranslations("applicationTracker.new");

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
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <NewApplicationForm
        resumeOptions={resumes.map((resume) => ({ value: resume.id, label: resume.title }))}
        coverLetterOptions={coverLetters.map((letter) => ({
          value: letter.id,
          label: `${letter.companyName} — ${letter.positionTitle}`,
        }))}
      />
    </div>
  );
}
