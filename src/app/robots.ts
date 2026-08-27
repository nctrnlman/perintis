import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-urls";

const PROTECTED_PATHS = ["/dashboard", "/ats-check", "/cover-letter", "/profile", "/resume-builder"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PROTECTED_PATHS,
        ...PROTECTED_PATHS.map((path) => `/en${path}`),
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
