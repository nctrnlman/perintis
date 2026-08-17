import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.termsOfService");
  return { title: t("title"), description: t("description") };
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
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="mt-6 text-muted-foreground">{t("body")}</p>
    </div>
  );
}
