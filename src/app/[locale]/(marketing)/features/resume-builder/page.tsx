import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FeaturePage } from "@/components/marketing/feature-page";
import { ResumePreviewCard } from "@/components/marketing/resume-preview-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "featurePages.resumeBuilder" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ResumeBuilderFeaturePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("featurePages.resumeBuilder");
  const bullets = t.raw("bullets") as string[];
  const faq = t.raw("faq") as { question: string; answer: string }[];

  return (
    <FeaturePage
      eyebrow={t("eyebrow")}
      headline={t("headline")}
      subhead={t("subhead")}
      bullets={bullets}
      cta={t("cta")}
      ctaId="features_resume_builder"
      preview={
        <ResumePreviewCard
          name={t("preview.name")}
          role={t("preview.role")}
          experienceLabel={t("preview.experienceLabel")}
          bullets={t.raw("preview.bullets") as string[]}
          skillsLabel={t("preview.skillsLabel")}
          skills={t.raw("preview.skills") as string[]}
        />
      }
      faqTitle={t("faqTitle")}
      faq={faq}
    />
  );
}
