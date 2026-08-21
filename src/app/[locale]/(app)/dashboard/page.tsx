import {
  FileCheck2,
  FileEdit,
  Gauge,
  Mail,
  ListChecks,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ModuleCard } from "@/components/shared/module-card";
import { Reveal } from "@/components/shared/reveal";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { StatsRow } from "@/components/dashboard/stats-row";
import { ProfileCompletenessCard } from "@/components/dashboard/profile-completeness-card";
import { QuickStartCard } from "@/components/dashboard/quick-start-card";
import { computeProfileCompleteness } from "@/lib/profile-completeness";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];
const ACTIVE_MODULE_INDICES = new Set([1, 2, 4]);

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const modules = t.raw("modules") as { title: string; description: string; steps?: string[] }[];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profile, resumeCount, atsCheckCount, coverLetterCount, latestCheck] = await Promise.all([
    db.profile.findUnique({
      where: { userId: user.id },
      include: {
        _count: {
          select: { workExperiences: true, educations: true, skills: true },
        },
      },
    }),
    db.resumeDocument.count({ where: { userId: user.id } }),
    db.aTSCheckAnalysis.count({ where: { userId: user.id } }),
    db.coverLetter.count({ where: { userId: user.id } }),
    db.aTSCheckAnalysis.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || null;

  const stats = [
    {
      label: t("stats.resumesLabel"),
      value: String(resumeCount),
      icon: FileEdit,
    },
    {
      label: t("stats.atsChecksLabel"),
      value: String(atsCheckCount),
      icon: ShieldCheck,
    },
    {
      label: t("stats.latestScoreLabel"),
      value: latestCheck ? String(latestCheck.overallScore) : t("stats.noScoreYet"),
      icon: Gauge,
    },
  ];

  const completeness = computeProfileCompleteness({
    fullName: profile?.fullName ?? null,
    phone: profile?.phone ?? null,
    location: profile?.location ?? null,
    summary: profile?.summary ?? null,
    targetRole: profile?.targetRole ?? null,
    workExperienceCount: profile?._count.workExperiences ?? 0,
    educationCount: profile?._count.educations ?? 0,
    skillCount: profile?._count.skills ?? 0,
  });

  const moduleStatuses: Record<number, string | undefined> = {
    1:
      atsCheckCount > 0
        ? t("moduleStatus.atsChecksDone", { count: atsCheckCount })
        : undefined,
    2:
      resumeCount > 0 ? t("moduleStatus.resumesCreated", { count: resumeCount }) : undefined,
    4:
      coverLetterCount > 0
        ? t("moduleStatus.coverLettersCreated", { count: coverLetterCount })
        : undefined,
  };

  const quickStartModules = modules
    .map((module, index) => ({ ...module, index }))
    .filter((module): module is typeof module & { steps: string[] } =>
      ACTIVE_MODULE_INDICES.has(module.index) && Boolean(module.steps?.length)
    );

  return (
    <div className="space-y-10">
      <GreetingHeader name={firstName} />

      <StatsRow stats={stats} />

      <ProfileCompletenessCard percentage={completeness.percentage} missing={completeness.missing} />

      {quickStartModules.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">{t("quickStartTitle")}</h2>
          <p className="mt-1 text-muted-foreground">{t("quickStartDescription")}</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {quickStartModules.map((module) => (
              <Reveal key={module.title} delay={module.index * 60}>
                <QuickStartCard
                  icon={moduleIcons[module.index]}
                  title={module.title}
                  steps={module.steps}
                />
              </Reveal>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">{t("modulesTitle")}</h2>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <Reveal key={module.title} delay={index * 60}>
              <ModuleCard
                icon={moduleIcons[index]}
                title={module.title}
                description={module.description}
                status={moduleStatuses[index]}
                comingSoon={!ACTIVE_MODULE_INDICES.has(index)}
                comingSoonLabel={t("comingSoon")}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
