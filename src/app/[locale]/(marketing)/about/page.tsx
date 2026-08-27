import type { Metadata } from "next";
import {
  BadgeCheck,
  Compass,
  FileCheck2,
  FileEdit,
  Languages,
  ListChecks,
  Mail,
  SearchCheck,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { DEVELOPER_LINKS } from "@/lib/developer-links";
import { buildAlternates } from "@/lib/site-urls";

const principleIcons = [SearchCheck, Languages, BadgeCheck];
const liveFeatures = [
  { href: "/features/ats-check", icon: FileCheck2, labelKey: "atsCheck" },
  { href: "/features/resume-builder", icon: FileEdit, labelKey: "resumeBuilder" },
  { href: "/features/cover-letter", icon: Mail, labelKey: "coverLetter" },
  { href: "/features/application-tracker", icon: ListChecks, labelKey: "applicationTracker" },
  { href: "/features/career-fit", icon: Compass, labelKey: "careerFit" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");
  const principles = t.raw("principles") as { title: string; description: string }[];

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Reveal>
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("headline")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            {t("intro")}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              nativeButton={false}
              render={
                <TrackedLink href="/register" cta="about_hero">
                  {t("heroCta")}
                </TrackedLink>
              }
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <TrackedLink href="/features" cta="about_hero_secondary">
                  {t("heroSecondaryCta")}
                </TrackedLink>
              }
            />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{t("trustLine")}</p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-24">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight">{t("missionHeading")}</h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
            {t("missionBody")}
          </p>
        </Reveal>

        <Reveal delay={100}>
          <h2 className="mt-16 text-2xl font-semibold tracking-tight">
            {t("principlesHeading")}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {principles.map((principle, index) => {
              const Icon = principleIcons[index];
              return (
                <div key={principle.title} className="rounded-2xl border border-border p-6">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4.5 text-foreground" />
                  </div>
                  <h3 className="mt-4 font-semibold">{principle.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {principle.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="mt-16 rounded-2xl border border-border p-8">
            <h2 className="text-lg font-semibold">{t("offeringsHeading")}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{t("offeringsDescription")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {liveFeatures.map(({ href, icon: Icon, labelKey }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {tNav(labelKey)}
                </Link>
              ))}
            </div>
            <Link
              href="/features"
              className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
            >
              {tNav("seeAllFeatures")} &rarr;
            </Link>
          </div>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-16">
            <h2 className="text-2xl font-semibold tracking-tight">{t("whoHeading")}</h2>
            <div className="mt-6 max-w-2xl rounded-2xl border border-border p-8">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                RD
              </div>
              <p className="mt-4 text-lg font-semibold">Rhazes Devino</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("whoBody")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {DEVELOPER_LINKS.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("mailto:") ? undefined : "_blank"}
                    rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                    aria-label={label}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="bg-muted py-24">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("closingHeading")}
          </h2>
          <Button
            size="lg"
            className="mt-8"
            nativeButton={false}
            render={
              <TrackedLink href="/register" cta="about_closing">
                {t("closingCta")}
              </TrackedLink>
            }
          />
        </Reveal>
      </div>
    </div>
  );
}
