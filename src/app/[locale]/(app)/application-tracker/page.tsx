import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { computeApplicationStats } from "@/lib/application-tracker/stats";
import { ApplicationStatsRow } from "@/components/application-tracker/stats-row";
import { KanbanBoard, type KanbanApplication } from "@/components/application-tracker/kanban-board";

export default async function ApplicationTrackerPage() {
  const t = await getTranslations("applicationTracker");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { interviewRounds: true } } },
  });

  const stats = computeApplicationStats(applications.map((application) => application.stage));

  const kanbanApplications: KanbanApplication[] = applications.map((application) => ({
    id: application.id,
    token: encryptId(application.id),
    companyName: application.companyName,
    positionTitle: application.positionTitle,
    stage: application.stage,
    hasResume: application.resumeDocumentId !== null,
    hasCoverLetter: application.coverLetterId !== null,
    roundCount: application._count.interviewRounds,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/application-tracker/new">{t("newButton")}</Link>}
        />
      </div>

      <div className="mt-8">
        <ApplicationStatsRow stats={stats} />
      </div>

      {applications.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-8">
          <KanbanBoard applications={kanbanApplications} />
        </div>
      )}
    </div>
  );
}
