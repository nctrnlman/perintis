import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://perintis.devino.id";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/privacy-policy`, lastModified: new Date() },
    { url: `${base}/terms-of-service`, lastModified: new Date() },
  ];
}
