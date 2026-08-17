import type { Metadata } from "next";
import {
  BadgeCheck,
  FileCheck2,
  FileEdit,
  Languages,
  Mail,
  ListChecks,
  MessagesSquare,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

const reasonIcons = [SearchCheck, Languages, BadgeCheck];
const coreIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home.meta");
  return { title: t("title"), description: t("description") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const reasons = t.raw("reasons.items") as { title: string; description: string }[];
  const coreFeatures = t.raw("core.items") as { title: string; description: string }[];
  const upcomingModules = t.raw("upcoming.items") as string[];

  return (
    <>
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center">
        <Reveal>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            {t("hero.headlineLine1")}
            <br />
            {t("hero.headlineLine2")}
          </h1>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {t("hero.subhead")}
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex gap-4">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/register">{t("hero.ctaPrimary")}</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login">{t("hero.ctaSecondary")}</Link>}
            />
          </div>
        </Reveal>
      </section>

      <section className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {t("reasons.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("reasons.heading")}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {reasons.map((reason, index) => {
              const Icon = reasonIcons[index];
              return (
                <Reveal key={reason.title} delay={index * 100}>
                  <div className="h-full rounded-2xl border border-border p-8">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-5 text-foreground" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">
                      {reason.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {t("core.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("core.heading")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("core.description")}
            </p>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature, index) => {
              const Icon = coreIcons[index];
              return (
                <Reveal key={feature.title} delay={index * 80}>
                  <div className="h-full rounded-2xl border border-border p-8 transition-transform hover:scale-[1.02]">
                    <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                      <Icon className="size-5 text-foreground" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal
            delay={200}
            className="mt-16 border-t border-border pt-10 text-center"
          >
            <p className="text-sm text-muted-foreground">
              {t("upcoming.label")}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {upcomingModules.map((module) => (
                <span
                  key={module}
                  className="rounded-full bg-muted px-3.5 py-1.5 text-sm text-muted-foreground"
                >
                  {module}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted py-24">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("closing.heading")}
          </h2>
          <Button
            size="lg"
            className="mt-8"
            nativeButton={false}
            render={<Link href="/register">{t("closing.cta")}</Link>}
          />
        </Reveal>
      </section>
    </>
  );
}
