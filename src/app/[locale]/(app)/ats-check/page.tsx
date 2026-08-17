import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";

export default async function AtsCheckListPage() {
  const t = await getTranslations("ats.list");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const checks = user
    ? await db.aTSCheckAnalysis.findMany({
        where: { userId: user.id },
        include: { resume: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/ats-check/new">{t("newButton")}</Link>}
        />
      </div>

      {checks.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border">
          <div className="grid grid-cols-3 gap-4 border-b border-border bg-muted/50 p-4 text-xs font-medium text-muted-foreground">
            <span>{t("tableFilename")}</span>
            <span>{t("tableScore")}</span>
            <span>{t("tableDate")}</span>
          </div>
          {checks.map((check) => (
            <Link
              key={check.id}
              href={`/ats-check/${encryptId(check.id)}`}
              className="grid grid-cols-3 items-center gap-4 border-b border-border p-4 text-sm transition-colors last:border-0 hover:bg-muted"
            >
              <span className="truncate font-medium">
                {check.resume.filename ?? "-"}
              </span>
              <span>{check.overallScore}</span>
              <span className="text-muted-foreground">
                {check.createdAt.toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
