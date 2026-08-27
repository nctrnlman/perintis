"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { analyzeContent } from "@/lib/resume/content-analysis";
import { analyzeDocxStructure, extractDocxText } from "@/lib/resume/docx";
import { extractResumeKeywords, type ResumeKeywords } from "@/lib/resume/extract-keywords";
import { matchKeywords, type KeywordMatchResult } from "@/lib/resume/match-keywords";
import { analyzePdfStructure, extractPdfText } from "@/lib/resume/pdf";
import { scoreFindings } from "@/lib/resume/scoring";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function detectFileType(bytes: Uint8Array): "pdf" | "docx" | "unknown" {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "pdf";
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "docx";
  }
  return "unknown";
}

export async function uploadAndAnalyzeResume(
  formData: FormData
): Promise<
  | { token: string; jobMatchFailed: boolean; keywordExtractionFailed: boolean }
  | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "not-authenticated" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "no-file" };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "too-large" };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const fileType = detectFileType(bytes);

  if (fileType === "unknown") {
    return { error: "unsupported-type" };
  }

  let rawText: string;
  let findings;

  try {
    if (fileType === "pdf") {
      // pdfjs-dist detaches the ArrayBuffer it's given, so each call needs
      // its own independent copy of the bytes.
      rawText = await extractPdfText(arrayBuffer.slice(0));
      findings = await analyzePdfStructure(arrayBuffer.slice(0));
    } else {
      rawText = await extractDocxText(arrayBuffer);
      findings = await analyzeDocxStructure(arrayBuffer);
    }
  } catch (err) {
    console.error("[ats-check] Failed to parse resume:", err);
    return { error: "parsing-failed" };
  }

  const overallScore = scoreFindings(findings);
  const contentFindings = analyzeContent(rawText);

  const jobPostingText = String(formData.get("jobPostingText") ?? "").trim();
  let keywordMatch: KeywordMatchResult | null = null;
  let jobMatchFailed = false;
  if (jobPostingText) {
    try {
      keywordMatch = await matchKeywords(rawText, jobPostingText);
    } catch (err) {
      // Keyword matching is a bonus on top of the structural check — if it
      // fails, the upload should still succeed with the structural results.
      // The caller surfaces jobMatchFailed to the user instead of staying silent.
      console.error("[ats-check] Keyword matching failed:", err);
      jobMatchFailed = true;
    }
  }

  let resumeKeywords: ResumeKeywords | null = null;
  let keywordExtractionFailed = false;
  try {
    resumeKeywords = await extractResumeKeywords(rawText);
  } catch (err) {
    // Same resilience rule as keyword matching — this is a bonus insight,
    // not something that should block the upload from succeeding.
    console.error("[ats-check] Resume keyword extraction failed:", err);
    keywordExtractionFailed = true;
  }

  const resume = await db.resume.create({
    data: {
      userId: user.id,
      filename: file.name.slice(0, 255),
      rawText,
      source: "uploaded",
    },
  });

  const analysis = await db.aTSCheckAnalysis.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      overallScore,
      structuralFindings: JSON.parse(JSON.stringify(findings)),
      contentFindings: JSON.parse(JSON.stringify(contentFindings)),
      jobPostingText: jobPostingText || null,
      keywordFindings: keywordMatch ? JSON.parse(JSON.stringify(keywordMatch)) : undefined,
      resumeKeywords: resumeKeywords ? JSON.parse(JSON.stringify(resumeKeywords)) : undefined,
    },
  });

  return { token: encryptId(analysis.id), jobMatchFailed, keywordExtractionFailed };
}

export async function deleteAtsCheckAnalysis(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.aTSCheckAnalysis.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.aTSCheckAnalysis.delete({ where: { id } });
  revalidatePath("/ats-check");
  return { success: true };
}
