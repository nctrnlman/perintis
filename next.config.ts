import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // pdfjs-dist resolves its worker file via a dynamic import() at runtime,
  // which breaks when Turbopack/webpack tries to bundle it into a chunk.
  // Loading it unbundled (as a normal Node dependency) sidesteps that.
  serverExternalPackages: ["pdfjs-dist"],
};

export default withNextIntl(nextConfig);
