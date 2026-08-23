declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean>;

/**
 * No-ops when GA hasn't loaded (dev/preview environments, or the user hasn't
 * accepted the cookie consent banner yet) — safe to call unconditionally
 * from any client component.
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}
