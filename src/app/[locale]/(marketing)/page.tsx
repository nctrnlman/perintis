import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  Compass,
  FileCheck2,
  FileEdit,
  GraduationCap,
  Languages,
  Mail,
  ListChecks,
  MessagesSquare,
  SearchCheck,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { Link } from "@/i18n/navigation";
import { AtsPreviewCard } from "@/components/marketing/ats-preview-card";
import { ResumePreviewCard } from "@/components/marketing/resume-preview-card";
import { CoverLetterPreviewCard } from "@/components/marketing/cover-letter-preview-card";
import { ApplicationTrackerPreviewCard } from "@/components/marketing/application-tracker-preview-card";
import { CareerFitPreviewCard } from "@/components/marketing/career-fit-preview-card";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { buildAlternates, SITE_URL } from "@/lib/site-urls";

const reasonIcons = [SearchCheck, Languages, BadgeCheck];
const coreIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks, Compass];
const coreHrefs: (string | null)[] = [
  null,
  "/features/ats-check",
  "/features/resume-builder",
  null,
  "/features/cover-letter",
  "/features/application-tracker",
  "/features/career-fit",
];
const personaIcons = [GraduationCap, ArrowRightLeft, TrendingUp];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("home.meta");
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale, "/"),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tDashboard = await getTranslations("dashboard");
  const tAppTrackerStats = await getTranslations("applicationTracker.stats");
  const reasons = t.raw("reasons.items") as { title: string; description: string }[];
  const personas = t.raw("personas.items") as {
    title: string;
    description: string;
    helpsWith: string;
  }[];
  const coreFeatures = t.raw("core.items") as { title: string; description: string }[];
  const upcomingModules = t.raw("upcoming.items") as string[];
  const atsShowcase = t.raw("showcase.atsCheck") as {
    eyebrow: string;
    headline: string;
    subhead: string;
    bullets: string[];
    cta: string;
    preview: {
      tierLabel: string;
      summaryLabel: string;
      matchedLabel: string;
      missingLabel: string;
    };
  };
  const resumeShowcase = t.raw("showcase.resumeBuilder") as {
    eyebrow: string;
    headline: string;
    subhead: string;
    bullets: string[];
    cta: string;
    preview: {
      name: string;
      role: string;
      experienceLabel: string;
      bullets: string[];
      skillsLabel: string;
      skills: string[];
    };
  };
  const coverLetterShowcase = t.raw("showcase.coverLetter") as {
    eyebrow: string;
    headline: string;
    subhead: string;
    bullets: string[];
    cta: string;
    preview: {
      companyLabel: string;
      positionLabel: string;
      greetingLine: string;
      bodyLines: string[];
      pdfLabel: string;
      wordLabel: string;
    };
  };
  const applicationTrackerShowcase = t.raw("showcase.applicationTracker") as {
    eyebrow: string;
    headline: string;
    subhead: string;
    bullets: string[];
    cta: string;
    preview: {
      appliedLabel: string;
      interviewingLabel: string;
      acceptedLabel: string;
    };
  };
  const careerFitShowcase = t.raw("showcase.careerFit") as {
    eyebrow: string;
    headline: string;
    subhead: string;
    bullets: string[];
    cta: string;
    preview: {
      strongLabel: string;
      goodLabel: string;
    };
  };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Perintis",
      url: SITE_URL,
      logo: `${SITE_URL}/icon`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Perintis",
      url: SITE_URL,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              render={
                <TrackedLink href="/register" cta="hero_primary">
                  {t("hero.ctaPrimary")}
                </TrackedLink>
              }
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={
                <TrackedLink href="/login" cta="hero_secondary">
                  {t("hero.ctaSecondary")}
                </TrackedLink>
              }
            />
          </div>
        </Reveal>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {t("personas.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("personas.heading")}
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {personas.map((persona, index) => {
              const Icon = personaIcons[index];
              return (
                <Reveal key={persona.title} delay={index * 100}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-background p-8 transition-transform duration-300 hover:scale-[1.02]">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-4 -right-2 text-8xl font-bold tracking-tighter text-foreground/[0.05] select-none"
                    >
                      0{index + 1}
                    </span>
                    <div className="relative flex size-11 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <h3 className="relative mt-5 text-xl font-semibold">{persona.title}</h3>
                    <p className="relative mt-2 text-muted-foreground">{persona.description}</p>
                    <div className="relative mt-6 flex items-start gap-2 border-t border-border pt-5">
                      <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" />
                      <p className="text-sm font-medium text-foreground">{persona.helpsWith}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {atsShowcase.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {atsShowcase.headline}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{atsShowcase.subhead}</p>
              <ul className="mt-6 space-y-3">
                {atsShowcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={
                    <TrackedLink href="/register" cta="ats_check_showcase">
                      {atsShowcase.cta}
                    </TrackedLink>
                  }
                />
                <TrackedLink
                  href="/features/ats-check"
                  cta="ats_check_learn_more"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {t("learnMore")}
                </TrackedLink>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <AtsPreviewCard
                tierLabel={atsShowcase.preview.tierLabel}
                summaryLabel={atsShowcase.preview.summaryLabel}
                matchedLabel={atsShowcase.preview.matchedLabel}
                missingLabel={atsShowcase.preview.missingLabel}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="lg:order-2">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {resumeShowcase.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {resumeShowcase.headline}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{resumeShowcase.subhead}</p>
              <ul className="mt-6 space-y-3">
                {resumeShowcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={
                    <TrackedLink href="/register" cta="resume_builder_showcase">
                      {resumeShowcase.cta}
                    </TrackedLink>
                  }
                />
                <TrackedLink
                  href="/features/resume-builder"
                  cta="resume_builder_learn_more"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {t("learnMore")}
                </TrackedLink>
              </div>
            </Reveal>
            <Reveal delay={150} className="lg:order-1">
              <ResumePreviewCard
                name={resumeShowcase.preview.name}
                role={resumeShowcase.preview.role}
                experienceLabel={resumeShowcase.preview.experienceLabel}
                bullets={resumeShowcase.preview.bullets}
                skillsLabel={resumeShowcase.preview.skillsLabel}
                skills={resumeShowcase.preview.skills}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {coverLetterShowcase.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {coverLetterShowcase.headline}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{coverLetterShowcase.subhead}</p>
              <ul className="mt-6 space-y-3">
                {coverLetterShowcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={
                    <TrackedLink href="/register" cta="cover_letter_showcase">
                      {coverLetterShowcase.cta}
                    </TrackedLink>
                  }
                />
                <TrackedLink
                  href="/features/cover-letter"
                  cta="cover_letter_learn_more"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {t("learnMore")}
                </TrackedLink>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <CoverLetterPreviewCard
                companyLabel={coverLetterShowcase.preview.companyLabel}
                positionLabel={coverLetterShowcase.preview.positionLabel}
                greetingLine={coverLetterShowcase.preview.greetingLine}
                bodyLines={coverLetterShowcase.preview.bodyLines}
                pdfLabel={coverLetterShowcase.preview.pdfLabel}
                wordLabel={coverLetterShowcase.preview.wordLabel}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal className="lg:order-2">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {applicationTrackerShowcase.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {applicationTrackerShowcase.headline}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                {applicationTrackerShowcase.subhead}
              </p>
              <ul className="mt-6 space-y-3">
                {applicationTrackerShowcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={
                    <TrackedLink href="/register" cta="application_tracker_showcase">
                      {applicationTrackerShowcase.cta}
                    </TrackedLink>
                  }
                />
                <TrackedLink
                  href="/features/application-tracker"
                  cta="application_tracker_learn_more"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {t("learnMore")}
                </TrackedLink>
              </div>
            </Reveal>
            <Reveal delay={150} className="lg:order-1">
              <ApplicationTrackerPreviewCard
                appliedLabel={applicationTrackerShowcase.preview.appliedLabel}
                interviewingLabel={applicationTrackerShowcase.preview.interviewingLabel}
                acceptedLabel={applicationTrackerShowcase.preview.acceptedLabel}
                totalLabel={tAppTrackerStats("total")}
                staleLabel={tAppTrackerStats("staleCount")}
              />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {careerFitShowcase.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {careerFitShowcase.headline}
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">{careerFitShowcase.subhead}</p>
              <ul className="mt-6 space-y-3">
                {careerFitShowcase.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={
                    <TrackedLink href="/register" cta="career_fit_showcase">
                      {careerFitShowcase.cta}
                    </TrackedLink>
                  }
                />
                <TrackedLink
                  href="/features/career-fit"
                  cta="career_fit_learn_more"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  {t("learnMore")}
                </TrackedLink>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <CareerFitPreviewCard
                strongLabel={careerFitShowcase.preview.strongLabel}
                goodLabel={careerFitShowcase.preview.goodLabel}
              />
            </Reveal>
          </div>
        </div>
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
              const href = coreHrefs[index];
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
                  <h3 className="mt-5 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
              return (
                <Reveal key={feature.title} delay={index * 80}>
                  {href ? <Link href={href}>{card}</Link> : card}
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
            render={
              <TrackedLink href="/register" cta="closing">
                {t("closing.cta")}
              </TrackedLink>
            }
          />
        </Reveal>
      </section>
    </>
  );
}
