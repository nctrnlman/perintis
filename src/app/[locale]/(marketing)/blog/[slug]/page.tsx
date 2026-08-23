import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalDocument } from "@/components/legal/legal-document";
import { BLOG_SLUGS, type BlogSlug } from "@/lib/blog-slugs";

interface BlogPostContent {
  title: string;
  excerpt: string;
  publishedLabel: string;
  sections: { heading: string; body?: string; list?: string[] }[];
}

function isBlogSlug(slug: string): slug is BlogSlug {
  return (BLOG_SLUGS as readonly string[]).includes(slug);
}

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isBlogSlug(slug)) return {};

  const t = await getTranslations({ locale, namespace: "blog" });
  const post = t.raw(`posts.${slug}`) as BlogPostContent;
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isBlogSlug(slug)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const post = t.raw(`posts.${slug}`) as BlogPostContent;

  return (
    <div className="mx-auto max-w-3xl px-6 pt-16">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; {t("backToBlog")}
      </Link>
      <LegalDocument
        title={post.title}
        lastUpdated={post.publishedLabel}
        intro={post.excerpt}
        sections={post.sections}
      />
    </div>
  );
}
