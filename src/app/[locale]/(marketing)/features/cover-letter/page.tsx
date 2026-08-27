import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturePage } from "@/components/marketing/feature-page";
import { CoverLetterPreviewCard } from "@/components/marketing/cover-letter-preview-card";
import { buildAlternates, localizedUrl } from "@/lib/site-urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "featurePages.coverLetter" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/features/cover-letter"),
  };
}

export default async function CoverLetterFeaturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("featurePages.coverLetter");
  const tNav = await getTranslations("nav");
  const bullets = t.raw("bullets") as string[];
  const faq = t.raw("faq") as { question: string; answer: string }[];
  const howItWorksSteps = t.raw("howItWorksSteps") as { title: string; description: string }[];

  return (
    <FeaturePage
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      subhead={t("subhead")}
      bullets={bullets}
      cta={t("cta")}
      ctaId="features_cover_letter"
      howItWorksTitle={t("howItWorksTitle")}
      howItWorksSteps={howItWorksSteps}
      breadcrumb={[
        { name: "Perintis", url: localizedUrl(locale, "/") },
        { name: tNav("features"), url: localizedUrl(locale, "/features") },
        { name: t("headline"), url: localizedUrl(locale, "/features/cover-letter") },
      ]}
      preview={
        <CoverLetterPreviewCard
          companyLabel={t("preview.companyLabel")}
          positionLabel={t("preview.positionLabel")}
          greetingLine={t("preview.greetingLine")}
          bodyLines={t.raw("preview.bodyLines") as string[]}
          pdfLabel={t("preview.pdfLabel")}
          wordLabel={t("preview.wordLabel")}
        />
      }
      faqTitle={t("faqTitle")}
      faq={faq}
    />
  );
}
