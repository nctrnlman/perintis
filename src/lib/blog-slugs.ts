export const BLOG_SLUGS = ["ats-friendly-resume", "cover-letter-mistakes"] as const;

export type BlogSlug = (typeof BLOG_SLUGS)[number];
