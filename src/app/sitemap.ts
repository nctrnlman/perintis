import type { MetadataRoute } from "next";
import { BLOG_SLUGS } from "@/lib/blog-slugs";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://perintis.devino.id";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/features`, lastModified: new Date() },
    { url: `${base}/features/ats-check`, lastModified: new Date() },
    { url: `${base}/features/resume-builder`, lastModified: new Date() },
    { url: `${base}/features/cover-letter`, lastModified: new Date() },
    { url: `${base}/pricing`, lastModified: new Date() },
    { url: `${base}/about`, lastModified: new Date() },
    { url: `${base}/blog`, lastModified: new Date() },
    ...BLOG_SLUGS.map((slug) => ({ url: `${base}/blog/${slug}`, lastModified: new Date() })),
    { url: `${base}/contact`, lastModified: new Date() },
    { url: `${base}/privacy-policy`, lastModified: new Date() },
    { url: `${base}/terms-of-service`, lastModified: new Date() },
  ];
}
