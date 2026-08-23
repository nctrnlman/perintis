"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import {
  acceptConsent,
  declineConsent,
  getConsentServerSnapshot,
  getConsentSnapshot,
  subscribeConsent,
  type ConsentStatus,
} from "@/lib/cookie-consent-store";

interface CookieConsentContextValue {
  status: ConsentStatus;
  accept: () => void;
  decline: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const status = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );

  return (
    <CookieConsentContext.Provider value={{ status, accept: acceptConsent, decline: declineConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}
