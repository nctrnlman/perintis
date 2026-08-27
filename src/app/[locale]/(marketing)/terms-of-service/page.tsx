import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalDocument } from "@/components/legal/legal-document";
import { buildAlternates } from "@/lib/site-urls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.termsOfService" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates(locale, "/terms-of-service"),
  };
}

export default async function TermsOfServicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal.termsOfService");

  return (
    <LegalDocument
      title={t("title")}
      lastUpdated={t("lastUpdated")}
      intro={t("intro")}
      sections={t.raw("sections")}
    />
  );
}
