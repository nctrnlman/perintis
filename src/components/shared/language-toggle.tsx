"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  const nextLocale = locale === "id" ? "en" : "id";

  function handleToggle() {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("switchLanguage", { locale: nextLocale.toUpperCase() })}
      onClick={handleToggle}
    >
      <span className="text-xs font-semibold uppercase">{nextLocale}</span>
    </Button>
  );
}
