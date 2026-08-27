"use client";

import { useSyncExternalStore } from "react";
import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "./cookie-consent-provider";

function subscribeNoop() {
  return () => {};
}
function getHasMountedSnapshot() {
  return true;
}
function getHasMountedServerSnapshot() {
  return false;
}

/**
 * True only after the client has hydrated. The real consent status is read
 * from localStorage, which the server can't see, so the server (and the
 * client's first hydration pass) must render as if nothing is decided yet
 * to avoid a mismatch. Gating on this prevents that placeholder state from
 * ever painting, instead of rendering it and correcting a frame later.
 */
function useHasMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    getHasMountedSnapshot,
    getHasMountedServerSnapshot
  );
}

export function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const { status, accept, decline } = useCookieConsent();
  const hasMounted = useHasMounted();

  if (!hasMounted || status !== "pending") {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96">
      <div className="animate-in slide-in-from-bottom-4 fade-in-0 rounded-2xl border border-border bg-card p-5 shadow-xl duration-300">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Cookie className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{t("title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("message")}</p>
            <Link
              href="/privacy-policy"
              className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline"
            >
              {t("privacyLink")}
            </Link>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={decline}>
            {t("decline")}
          </Button>
          <Button size="sm" className="flex-1" onClick={accept}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
