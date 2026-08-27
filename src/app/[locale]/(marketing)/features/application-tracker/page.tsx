import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturePage } from "@/components/marketing/feature-page";
import { ApplicationTrackerPreviewCard } from "@/components/marketing/application-tracker-preview-card";
import { buildAlternates, localizedUrl } from "@/lib/site-urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "featurePages.applicationTracker" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/features/application-tracker"),
  };
}

export default async function ApplicationTrackerFeaturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("featurePages.applicationTracker");
  const tNav = await getTranslations("nav");
  const tStats = await getTranslations("applicationTracker.stats");
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
      ctaId="features_application_tracker"
      howItWorksTitle={t("howItWorksTitle")}
      howItWorksSteps={howItWorksSteps}
      breadcrumb={[
        { name: "Perintis", url: localizedUrl(locale, "/") },
        { name: tNav("features"), url: localizedUrl(locale, "/features") },
        { name: t("headline"), url: localizedUrl(locale, "/features/application-tracker") },
      ]}
      preview={
        <ApplicationTrackerPreviewCard
          appliedLabel={t("preview.appliedLabel")}
          interviewingLabel={t("preview.interviewingLabel")}
          acceptedLabel={t("preview.acceptedLabel")}
          totalLabel={tStats("total")}
          staleLabel={tStats("staleCount")}
        />
      }
      faqTitle={t("faqTitle")}
      faq={faq}
    />
  );
}
