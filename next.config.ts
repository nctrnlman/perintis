import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // pdfjs-dist resolves its worker file via a dynamic import() at runtime,
  // which breaks when Turbopack/webpack tries to bundle it into a chunk.
  // Loading it unbundled (as a normal Node dependency) sidesteps that.
  serverExternalPackages: ["pdfjs-dist"],
  // Our root layout lives under the [locale] dynamic segment, so a fully
  // unmatched path (no locale-scoped not-found.tsx to catch it) needs this
  // to get a branded 404 instead of Next's generic fallback.
  experimental: {
    globalNotFound: true,
  },
  // Prisma's query engine binary is generated to a custom path
  // (src/generated/prisma) and loaded dynamically at runtime by the
  // generated client, so Next's static file-tracing (@vercel/nft) never
  // detects it as a dependency and omits it from the deployed serverless
  // function — causing "could not locate the Query Engine" in production
  // even though it built fine locally. Force it into every route's trace.
  outputFileTracingIncludes: {
    "/*": ["./src/generated/prisma/**/*"],
  },
};

export default withNextIntl(nextConfig);
