import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturePage } from "@/components/marketing/feature-page";
import { CareerFitPreviewCard } from "@/components/marketing/career-fit-preview-card";
import { buildAlternates, localizedUrl } from "@/lib/site-urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "featurePages.careerFit" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/features/career-fit"),
  };
}

export default async function CareerFitFeaturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("featurePages.careerFit");
  const tNav = await getTranslations("nav");
  const bullets = t.raw("bullets") as string[];
  const faq = t.raw("faq") as { question: string; answer: string }[];

  return (
    <FeaturePage
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      subhead={t("subhead")}
      bullets={bullets}
      cta={t("cta")}
      ctaId="features_career_fit"
      breadcrumb={[
        { name: "Perintis", url: localizedUrl(locale, "/") },
        { name: tNav("features"), url: localizedUrl(locale, "/features") },
        { name: t("headline"), url: localizedUrl(locale, "/features/career-fit") },
      ]}
      preview={
        <CareerFitPreviewCard
          strongLabel={t("preview.strongLabel")}
          goodLabel={t("preview.goodLabel")}
        />
      }
      faqTitle={t("faqTitle")}
      faq={faq}
    />
  );
}
