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
