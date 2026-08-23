import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { TrackedLink } from "@/components/marketing/tracked-link";
import { BLOG_POST_CTA, BLOG_SLUGS, estimateReadingMinutes, type BlogSlug } from "@/lib/blog-slugs";

interface BlogPostContent {
  title: string;
  excerpt: string;
  publishedLabel: string;
  category: string;
  sections: { heading: string; body?: string; list?: string[] }[];
}

interface BlogPostSummary {
  title: string;
  excerpt: string;
  publishedLabel: string;
  category: string;
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
  const tNav = await getTranslations("nav");
  const post = t.raw(`posts.${slug}`) as BlogPostContent;
  const readingMinutes = estimateReadingMinutes(post.excerpt, post.sections);
  const cta = BLOG_POST_CTA[slug];
  const otherSlugs = BLOG_SLUGS.filter((s) => s !== slug).slice(0, 3);

  return (
    <article className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; {t("backToBlog")}
      </Link>

      <Reveal>
        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-foreground">
              {post.category}
            </span>
            <span>{post.publishedLabel}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{t("readingTime", { minutes: readingMinutes })}</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>
        </header>
      </Reveal>

      <div className="mt-12 space-y-10 border-t border-border pt-12">
        {post.sections.map((section, index) => (
          <Reveal key={section.heading} delay={Math.min(index * 40, 200)}>
            <section>
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              {section.body && (
                <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
              )}
              {section.list && (
                <ul className="mt-3 space-y-2">
                  {section.list.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex gap-2.5 leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-[10px] size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>
        ))}
      </div>

      <Reveal delay={100}>
        <div className="mt-16 rounded-3xl border border-border bg-card p-10 text-center">
          <p className="text-lg font-semibold">{t("ctaHeading")}</p>
          <Button
            size="lg"
            className="mt-5"
            nativeButton={false}
            render={
              <TrackedLink href={cta.href} cta={`blog_${slug}`}>
                {t("ctaButton", { feature: tNav(cta.featureLabelKey) })}
              </TrackedLink>
            }
          />
        </div>
      </Reveal>

      {otherSlugs.length > 0 && (
        <Reveal delay={150}>
          <div className="mt-16">
            <h2 className="text-lg font-semibold">{t("moreFromBlog")}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {otherSlugs.map((otherSlug) => {
                const otherPost = t.raw(`posts.${otherSlug}`) as BlogPostSummary;
                return (
                  <Link
                    key={otherSlug}
                    href={`/blog/${otherSlug}`}
                    className="rounded-2xl border border-border p-6 transition-transform hover:scale-[1.02]"
                  >
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {otherPost.category}
                    </span>
                    <h3 className="mt-3 text-sm font-semibold">{otherPost.title}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}
    </article>
  );
}
