"use client";

import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { useCookieConsent } from "./cookie-consent-provider";
import { AnalyticsPageview } from "./analytics-pageview";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export function Analytics() {
  const { status } = useCookieConsent();

  if (!GA_ID || process.env.NODE_ENV !== "production" || status !== "accepted") {
    return null;
  }

  return (
    <>
      <GoogleAnalytics gaId={GA_ID} />
      <Suspense fallback={null}>
        <AnalyticsPageview />
      </Suspense>
    </>
  );
}
