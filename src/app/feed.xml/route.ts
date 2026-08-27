import { getTranslations } from "next-intl/server";
import { BLOG_SLUGS } from "@/lib/blog-slugs";
import { localizedUrl } from "@/lib/site-urls";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const t = await getTranslations({ locale: "id", namespace: "blog" });

  const items = BLOG_SLUGS.map((slug) => {
    const post = t.raw(`posts.${slug}`) as { title: string; excerpt: string };
    const url = localizedUrl("id", `/blog/${slug}`);
    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(t("heading"))}</title>
    <link>${localizedUrl("id", "/blog")}</link>
    <description>${escapeXml(t("description"))}</description>
    <language>id</language>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
