import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/shared/reveal";
import { BLOG_SLUGS } from "@/lib/blog-slugs";

interface BlogPostSummary {
  title: string;
  excerpt: string;
  publishedLabel: string;
  category: string;
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <Reveal>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("heading")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </Reveal>

      <div className="mt-14 space-y-8">
        {BLOG_SLUGS.map((slug, index) => {
          const post = t.raw(`posts.${slug}`) as BlogPostSummary;
          return (
            <Reveal key={slug} delay={index * 80}>
              <Link
                href={`/blog/${slug}`}
                className="block rounded-2xl border border-border p-8 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {post.category}
                  </span>
                  <p className="text-xs text-muted-foreground">{post.publishedLabel}</p>
                </div>
                <h2 className="mt-3 text-xl font-semibold">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
