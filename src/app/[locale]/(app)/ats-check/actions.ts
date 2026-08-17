"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { analyzeDocxStructure, extractDocxText } from "@/lib/resume/docx";
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
): Promise<{ token: string } | { error: string }> {
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
      rawText = await extractPdfText(arrayBuffer);
      findings = await analyzePdfStructure(arrayBuffer);
    } else {
      rawText = await extractDocxText(arrayBuffer);
      findings = await analyzeDocxStructure(arrayBuffer);
    }
  } catch (err) {
    console.error("[ats-check] Failed to parse resume:", err);
    return { error: "parsing-failed" };
  }

  const overallScore = scoreFindings(findings);

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
    },
  });

  return { token: encryptId(analysis.id) };
}
