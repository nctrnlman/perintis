"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "./cookie-consent-provider";

export function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const { status, accept, decline } = useCookieConsent();

  if (status !== "pending") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("message")}</p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={decline}>
            {t("decline")}
          </Button>
          <Button size="sm" onClick={accept}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
