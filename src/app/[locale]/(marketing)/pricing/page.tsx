import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const included = t.raw("included") as string[];
  const faq = t.raw("faq") as { question: string; answer: string }[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <Reveal className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("heading")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("subhead")}</p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-12 rounded-3xl border border-border p-10">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Perintis
          </p>
          <p className="mt-2 text-5xl font-semibold tracking-tight">
            {t("freeLabel")}
            <span className="text-lg font-normal text-muted-foreground"> {t("freeSuffix")}</span>
          </p>

          <ul className="mt-8 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-foreground" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="mt-8 w-full"
            nativeButton={false}
            render={
              <TrackedLink href="/register" cta="pricing_page">
                {t("cta")}
              </TrackedLink>
            }
          />
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="mt-16">
          <h2 className="text-xl font-semibold">{t("faqHeading")}</h2>
          <div className="mt-6 space-y-6">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="font-medium">{item.question}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          {t.rich("contactPrompt", {
            contact: (chunks) => (
              <Link href="/contact" className="font-medium text-primary hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </Reveal>
    </div>
  );
}
