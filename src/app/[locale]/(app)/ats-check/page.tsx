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
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">{t("tableFilename")}</th>
                <th className="p-4 font-medium">{t("tableScore")}</th>
                <th className="p-4 font-medium">{t("tableDate")}</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.id} className="border-b border-border last:border-0">
                  <td className="p-4">
                    <Link
                      href={`/ats-check/${encryptId(check.id)}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {check.resume.filename ?? "-"}
                    </Link>
                  </td>
                  <td className="p-4">{check.overallScore}</td>
                  <td className="p-4 text-muted-foreground">
                    {check.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
