"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ResumePdfDocument } from "@/lib/resume-builder/pdf-template";
import type { ResumeContent } from "@/lib/resume-builder/types";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => null }
);

export function ResumePreviewPanel({ content }: { content: ResumeContent }) {
  const t = useTranslations("resumeBuilder.builder");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border">
      <div className="border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground">
        {t("previewTitle")}
      </div>
      <PDFViewer style={{ width: "100%", height: "100%", border: "none" }}>
        <ResumePdfDocument content={content} />
      </PDFViewer>
    </div>
  );
}
