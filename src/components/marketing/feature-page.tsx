import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";

interface FaqItem {
  question: string;
  answer: string;
}

interface FeaturePageProps {
  eyebrow: string;
  headline: string;
  subhead: string;
  bullets: string[];
  cta: string;
  ctaId: string;
  preview: ReactNode;
  faqTitle: string;
  faq: FaqItem[];
}

export function FeaturePage({
  eyebrow,
  headline,
  subhead,
  bullets,
  cta,
  ctaId,
  preview,
  faqTitle,
  faq,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
