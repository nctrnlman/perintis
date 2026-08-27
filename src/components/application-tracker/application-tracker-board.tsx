import { ListChecks } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { computeApplicationStats } from "@/lib/application-tracker/stats";
import { ApplicationStatsRow } from "@/components/application-tracker/stats-row";
import { KanbanBoard, type KanbanApplication } from "@/components/application-tracker/kanban-board";

export async function ApplicationTrackerBoard() {
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

  const stats = computeApplicationStats(
    applications.map((application) => ({
      stage: application.stage,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    }))
  );

  const kanbanApplications: KanbanApplication[] = applications.map((application) => ({
    id: application.id,
    token: encryptId(application.id),
    companyName: application.companyName,
    positionTitle: application.positionTitle,
    stage: application.stage,
    location: application.location,
    updatedAt: application.updatedAt,
    hasResume: application.resumeDocumentId !== null,
    hasCoverLetter: application.coverLetterId !== null,
    roundCount: application._count.interviewRounds,
  }));

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ListChecks className="size-4" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="mt-6">
        <ApplicationStatsRow stats={stats} />
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t("emptyTitle")}
          description={t("empty")}
          action={
            <Button
              nativeButton={false}
              render={<Link href="/application-tracker/new">{t("newButton")}</Link>}
            />
          }
        />
      ) : (
        <div className="mt-6">
          <KanbanBoard
            applications={kanbanApplications}
            addLabel={t("newButton")}
            scrollHint={t("scrollHint")}
          />
        </div>
      )}
    </div>
  );
}
