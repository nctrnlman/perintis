import { getTranslations } from "next-intl/server";
import { renderOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";

export const alt = "Perintis";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return renderOgImage(t("defaultTitle"), t("description"));
}
