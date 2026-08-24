import type { MetadataRoute } from "next";
import { BLOG_SLUGS } from "@/lib/blog-slugs";
import { localizedUrl } from "@/lib/site-urls";

const STATIC_PATHS = [
  "/",
  "/features",
  "/features/ats-check",
  "/features/resume-builder",
  "/features/cover-letter",
  "/features/application-tracker",
  "/pricing",
  "/about",
  "/blog",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
];

const PATHS = [...STATIC_PATHS, ...BLOG_SLUGS.map((slug) => `/blog/${slug}`)];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PATHS.map((path) => ({
    url: localizedUrl("id", path),
    lastModified,
    alternates: {
      languages: {
        id: localizedUrl("id", path),
        en: localizedUrl("en", path),
      },
    },
  }));
}
