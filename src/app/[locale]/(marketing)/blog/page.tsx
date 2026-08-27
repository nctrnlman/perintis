import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/shared/reveal";
import { BlogFilter } from "@/components/marketing/blog-filter";
import { BLOG_SLUGS } from "@/lib/blog-slugs";
import { buildAlternates } from "@/lib/site-urls";

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
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: buildAlternates(locale, "/blog"),
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const posts = BLOG_SLUGS.map((slug) => ({
    slug,
    ...(t.raw(`posts.${slug}`) as BlogPostSummary),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <Reveal>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("heading")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </Reveal>

      <BlogFilter
        posts={posts}
        allCategoriesLabel={t("allCategories")}
        searchPlaceholder={t("searchPlaceholder")}
        noResultsLabel={t("noResults")}
      />
    </div>
  );
}
