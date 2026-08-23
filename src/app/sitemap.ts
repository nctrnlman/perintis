import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://perintis.devino.id";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/features/ats-check`, lastModified: new Date() },
    { url: `${base}/features/resume-builder`, lastModified: new Date() },
    { url: `${base}/features/cover-letter`, lastModified: new Date() },
    { url: `${base}/contact`, lastModified: new Date() },
    { url: `${base}/privacy-policy`, lastModified: new Date() },
    { url: `${base}/terms-of-service`, lastModified: new Date() },
  ];
}
