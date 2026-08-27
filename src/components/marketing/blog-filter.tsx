"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BlogFilterPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedLabel: string;
  category: string;
}

interface BlogFilterProps {
  posts: BlogFilterPost[];
  allCategoriesLabel: string;
  searchPlaceholder: string;
  noResultsLabel: string;
}

export function BlogFilter({
  posts,
  allCategoriesLabel,
  searchPlaceholder,
  noResultsLabel,
}: BlogFilterProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(posts.map((post) => post.category))),
    [posts]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category ? post.category === category : true;
      const matchesQuery = normalizedQuery
        ? post.title.toLowerCase().includes(normalizedQuery) ||
          post.excerpt.toLowerCase().includes(normalizedQuery)
        : true;
      return matchesCategory && matchesQuery;
    });
  }, [posts, query, category]);

  return (
    <div className="mt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-border bg-background py-2 pr-4 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              category === null
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {allCategoriesLabel}
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                category === item
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-14 text-center text-sm text-muted-foreground">{noResultsLabel}</p>
      ) : (
        <div className="mt-8 space-y-8">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-border p-8 transition-transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {post.category}
                </span>
                <p className="text-xs text-muted-foreground">{post.publishedLabel}</p>
              </div>
              <h2 className="mt-3 text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
