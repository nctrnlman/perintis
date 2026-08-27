import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";

interface FaqItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface HowItWorksStep {
  title: string;
  description: string;
}

interface FeaturePageProps {
  eyebrow: string;
  headline: string;
  subhead: string;
  bullets: string[];
  cta: string;
  ctaId: string;
  preview: ReactNode;
  howItWorksTitle?: string;
  howItWorksSteps?: HowItWorksStep[];
  faqTitle: string;
  faq: FaqItem[];
  breadcrumb: BreadcrumbItem[];
}

export function FeaturePage({
  eyebrow,
  headline,
  subhead,
  bullets,
  cta,
  ctaId,
  preview,
  howItWorksTitle,
  howItWorksSteps,
  faqTitle,
  faq,
  breadcrumb,
}: FeaturePageProps) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                {headline}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">{subhead}</p>
              <ul className="mt-6 space-y-3">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                    <span className="text-muted-foreground">{bullet}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="mt-8"
                nativeButton={false}
                render={
                  <TrackedLink href="/register" cta={ctaId}>
                    {cta}
                  </TrackedLink>
                }
              />
            </Reveal>
            <Reveal delay={150}>{preview}</Reveal>
          </div>
        </div>
      </section>

      {howItWorksSteps && howItWorksSteps.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-5xl px-6">
            <Reveal>
              <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
                {howItWorksTitle}
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorksSteps.map((step, index) => (
                <Reveal key={step.title} delay={index * 80}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-card py-20">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{faqTitle}</h2>
            <div className="mt-8 space-y-6">
              {faq.map((item) => (
                <div key={item.question}>
                  <h3 className="font-medium">{item.question}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
