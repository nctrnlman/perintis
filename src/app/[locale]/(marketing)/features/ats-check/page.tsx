import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturePage } from "@/components/marketing/feature-page";
import { AtsPreviewCard } from "@/components/marketing/ats-preview-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "featurePages.atsCheck" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AtsCheckFeaturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("featurePages.atsCheck");
  const bullets = t.raw("bullets") as string[];
  const faq = t.raw("faq") as { question: string; answer: string }[];

  return (
    <FeaturePage
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      subhead={t("subhead")}
      bullets={bullets}
      cta={t("cta")}
      ctaId="features_ats_check"
      preview={
        <AtsPreviewCard
          tierLabel={t("preview.tierLabel")}
          summaryLabel={t("preview.summaryLabel")}
          matchedLabel={t("preview.matchedLabel")}
          missingLabel={t("preview.missingLabel")}
        />
      }
      faqTitle={t("faqTitle")}
      faq={faq}
    />
  );
}
