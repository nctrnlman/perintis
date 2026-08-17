import {
  FileCheck2,
  FileEdit,
  Mail,
  ListChecks,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ModuleCard } from "@/components/shared/module-card";
import { Reveal } from "@/components/shared/reveal";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const modules = t.raw("modules") as { title: string; description: string }[];

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => (
          <Reveal key={module.title} delay={index * 60}>
            <ModuleCard
              icon={moduleIcons[index]}
              {...module}
              comingSoonLabel={t("comingSoon")}
            />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
