import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/shared/reveal";
import { BLOG_SLUGS } from "@/lib/blog-slugs";

interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  publishedLabel: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = BLOG_SLUGS.map(
    (slug) => t.raw(`posts.${slug}`) as BlogPostSummary
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <Reveal>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("heading")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </Reveal>

      <div className="mt-14 space-y-8">
        {posts.map((post, index) => (
          <Reveal key={post.slug} delay={index * 80}>
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-border p-8 transition-transform hover:scale-[1.01]"
            >
              <p className="text-xs text-muted-foreground">{post.publishedLabel}</p>
              <h2 className="mt-2 text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
