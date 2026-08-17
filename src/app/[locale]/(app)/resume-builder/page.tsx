import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { CreateResumeButton } from "@/components/resume-builder/create-resume-button";
import { DeleteResumeButton } from "@/components/resume-builder/delete-resume-button";

export default async function ResumeBuilderListPage() {
  const t = await getTranslations("resumeBuilder.list");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const resumeDocuments = user
    ? await db.resumeDocument.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <CreateResumeButton />
      </div>

      {resumeDocuments.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-2 gap-4 border-b border-border bg-muted/50 p-4 text-xs font-medium text-muted-foreground">
            <span>{t("tableTitle")}</span>
            <span>{t("tableDate")}</span>
          </div>
          {resumeDocuments.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 border-b border-border p-4 text-sm transition-colors last:border-0 hover:bg-muted"
            >
              <Link
                href={`/resume-builder/${encryptId(doc.id)}`}
                className="grid flex-1 grid-cols-2 items-center gap-4"
              >
                <span className="truncate font-medium">{doc.title}</span>
                <span className="text-muted-foreground">
                  {doc.updatedAt.toLocaleDateString()}
                </span>
              </Link>
              <DeleteResumeButton id={doc.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
