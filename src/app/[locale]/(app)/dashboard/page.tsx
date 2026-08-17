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
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ModuleCard } from "@/components/shared/module-card";
import { Reveal } from "@/components/shared/reveal";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { StatsRow } from "@/components/dashboard/stats-row";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];

const moduleRoutes: Record<number, string> = {
  1: "/ats-check",
  2: "/resume-builder",
};

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const modules = t.raw("modules") as { title: string; description: string }[];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profile, resumeCount, atsCheckCount, latestCheck] = await Promise.all([
    db.profile.findUnique({ where: { userId: user.id } }),
    db.resumeDocument.count({ where: { userId: user.id } }),
    db.aTSCheckAnalysis.count({ where: { userId: user.id } }),
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

  return (
    <div className="space-y-8">
      <GreetingHeader name={firstName} />

      <StatsRow stats={stats} />

      <div>
        <p className="text-muted-foreground">{t("description")}</p>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => {
            const route = moduleRoutes[index];
            const card = (
              <ModuleCard
                icon={moduleIcons[index]}
                {...module}
                comingSoon={!route}
                comingSoonLabel={t("comingSoon")}
              />
            );

            if (route) {
              return (
                <Reveal key={module.title} delay={index * 60}>
                  <Link href={route}>{card}</Link>
                </Reveal>
              );
            }

            return (
              <Reveal key={module.title} delay={index * 60}>
                {card}
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
