import {
  FileCheck2,
  FileEdit,
  Mail,
  ListChecks,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { Reveal } from "@/components/shared/reveal";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { ScoreTrendCard } from "@/components/dashboard/score-trend-card";
import { ProfileCompletenessCard } from "@/components/dashboard/profile-completeness-card";
import { FeatureActionCard } from "@/components/dashboard/feature-action-card";
import { ComingSoonStrip } from "@/components/dashboard/coming-soon-strip";
import { computeProfileCompleteness } from "@/lib/profile-completeness";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];
const moduleHrefs: (string | null)[] = [
  null,
  "/ats-check",
  "/resume-builder",
  null,
  "/cover-letter",
  "/application-tracker",
];
const ACTIVE_MODULE_INDICES = new Set([1, 2, 4, 5]);

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

  const [profile, resumeCount, atsCheckCount, coverLetterCount, recentChecks, applicationCount] =
    await Promise.all([
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
      db.aTSCheckAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { overallScore: true },
      }),
      db.application.count({ where: { userId: user.id } }),
    ]);

  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || null;
  const scoreHistory = recentChecks.map((check) => check.overallScore).reverse();

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
    5:
      applicationCount > 0
        ? t("moduleStatus.applicationCountStatus", { count: applicationCount })
        : undefined,
  };

  const activeFeatures = modules
    .map((module, index) => ({ ...module, index }))
    .filter((module) => ACTIVE_MODULE_INDICES.has(module.index));

  const comingSoonFeatures = modules
    .map((module, index) => ({ ...module, index }))
    .filter((module) => !ACTIVE_MODULE_INDICES.has(module.index));

  return (
    <div className="space-y-10">
      <GreetingHeader name={firstName} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <ScoreTrendCard
            scores={scoreHistory}
            resumeCount={resumeCount}
            coverLetterCount={coverLetterCount}
          />
        </Reveal>
        <Reveal delay={80}>
          <ProfileCompletenessCard
            percentage={completeness.percentage}
            missing={completeness.missing}
          />
        </Reveal>
      </div>

      <div>
        <h2 className="text-lg font-semibold">{t("continueTitle")}</h2>
        <p className="mt-1 text-muted-foreground">{t("continueDescription")}</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {activeFeatures.map((feature) => (
            <Reveal key={feature.title} delay={feature.index * 60}>
              <FeatureActionCard
                icon={moduleIcons[feature.index]}
                href={moduleHrefs[feature.index]!}
                title={feature.title}
                hint={moduleStatuses[feature.index] ?? feature.steps?.[0] ?? feature.description}
              />
            </Reveal>
          ))}
        </div>
      </div>

      <ComingSoonStrip
        title={t("comingSoonTitle")}
        badgeLabel={t("comingSoon")}
        items={comingSoonFeatures.map((feature) => ({
          icon: moduleIcons[feature.index],
          title: feature.title,
        }))}
      />
    </div>
  );
}
