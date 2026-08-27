export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

/**
 * Builds a full public URL for a given locale and path. The "id" locale is
 * unprefixed (routing.ts uses localePrefix: "as-needed" with "id" as the
 * default locale), every other locale gets a "/{locale}" prefix.
 */
export function localizedUrl(locale: string, path: string): string {
  const cleanPath = path === "/" ? "" : path;
  const prefix = locale === "id" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${cleanPath}`;
}

/** Ready-to-spread `alternates` metadata field: canonical + hreflang pairs for every locale. */
export function buildAlternates(locale: string, path: string) {
  return {
    canonical: localizedUrl(locale, path),
    languages: {
      id: localizedUrl("id", path),
      en: localizedUrl("en", path),
    },
    types: { "application/rss+xml": `${SITE_URL}/feed.xml` },
  };
}
