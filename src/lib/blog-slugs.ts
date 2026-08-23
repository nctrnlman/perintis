export const BLOG_SLUGS = [
  "ats-friendly-resume",
  "cover-letter-mistakes",
  "resume-scan-time",
  "quantify-achievements",
  "hard-skills-vs-soft-skills",
  "resume-length",
  "career-gap",
  "linkedin-vs-resume",
  "cover-letter-tone",
  "tailor-resume-per-job",
] as const;

export type BlogSlug = (typeof BLOG_SLUGS)[number];

/**
 * Which product feature each post's closing CTA should point to. Keyed off
 * the stable slug rather than the post's (localized) category label, since
 * a display string shouldn't double as a routing key.
 */
export const BLOG_POST_CTA: Record<BlogSlug, { href: string; featureLabelKey: string }> = {
  "ats-friendly-resume": { href: "/features/ats-check", featureLabelKey: "atsCheck" },
  "cover-letter-mistakes": { href: "/features/cover-letter", featureLabelKey: "coverLetter" },
  "resume-scan-time": { href: "/features/ats-check", featureLabelKey: "atsCheck" },
  "quantify-achievements": { href: "/features/resume-builder", featureLabelKey: "resumeBuilder" },
  "hard-skills-vs-soft-skills": {
    href: "/features/resume-builder",
    featureLabelKey: "resumeBuilder",
  },
  "resume-length": { href: "/features/resume-builder", featureLabelKey: "resumeBuilder" },
  "career-gap": { href: "/features/resume-builder", featureLabelKey: "resumeBuilder" },
  "linkedin-vs-resume": { href: "/features", featureLabelKey: "features" },
  "cover-letter-tone": { href: "/features/cover-letter", featureLabelKey: "coverLetter" },
  "tailor-resume-per-job": { href: "/features/resume-builder", featureLabelKey: "resumeBuilder" },
};

interface ReadableSection {
  heading: string;
  body?: string;
  list?: string[];
}

/** Rough estimate at ~200 words per minute, rounded up, minimum 1 minute. */
export function estimateReadingMinutes(
  excerpt: string,
  sections: ReadableSection[]
): number {
  const text = [excerpt, ...sections.flatMap((s) => [s.body ?? "", ...(s.list ?? [])])].join(" ");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
