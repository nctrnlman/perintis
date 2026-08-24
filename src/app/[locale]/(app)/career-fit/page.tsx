import { getFormatter, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { DeletePotentialAnalysisButton } from "@/components/career-fit/delete-potential-analysis-button";

export default async function CareerFitListPage() {
  const t = await getTranslations("careerFit.list");
  const format = await getFormatter();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const analyses = await db.potentialAnalysis.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button nativeButton={false} render={<Link href="/career-fit/new">{t("newButton")}</Link>} />
      </div>

      {analyses.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8 space-y-3">
          {analyses.map((analysis) => {
            const results = analysis.results as { title: string }[];
            return (
              <div
                key={analysis.id}
                className="flex items-center justify-between rounded-2xl border border-border p-5"
              >
                <Link href={`/career-fit/${encryptId(analysis.id)}`} className="flex-1">
                  <p className="font-medium">{t("resultCount", { count: results.length })}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format.dateTime(analysis.createdAt, { dateStyle: "medium" })}
                  </p>
                </Link>
                <DeletePotentialAnalysisButton id={analysis.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
