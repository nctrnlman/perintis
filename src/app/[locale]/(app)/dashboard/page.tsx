import {
  FileCheck2,
  FileEdit,
  Mail,
  ListChecks,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ModuleCard } from "@/components/shared/module-card";
import { Reveal } from "@/components/shared/reveal";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];

const moduleRoutes: Record<number, string> = {
  1: "/ats-check",
  2: "/resume-builder",
};

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const modules = t.raw("modules") as { title: string; description: string }[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  );
}
