import type { Metadata } from "next";
import {
  FileCheck2,
  FileEdit,
  ListChecks,
  Mail,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/shared/reveal";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];
const moduleHrefs: (string | null)[] = [
  null,
  "/features/ats-check",
  "/features/resume-builder",
  null,
  "/features/cover-letter",
  null,
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "featuresIndex" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function FeaturesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("featuresIndex");
  const tHome = await getTranslations("home");
  const tDashboard = await getTranslations("dashboard");
  const modules = tHome.raw("core.items") as { title: string; description: string }[];

  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("heading")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </Reveal>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => {
          const Icon = moduleIcons[index];
          const href = moduleHrefs[index];
          const card = (
            <div className="h-full rounded-2xl border border-border p-8 transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-5 text-foreground" />
                </div>
                {!href && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    {tDashboard("comingSoon")}
                  </span>
                )}
              </div>
              <h2 className="mt-5 text-lg font-semibold">{module.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
            </div>
          );

          return (
            <Reveal key={module.title} delay={index * 80}>
              {href ? <Link href={href}>{card}</Link> : card}
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
