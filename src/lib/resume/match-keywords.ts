import { Type } from "@google/genai";
import { z } from "zod";
import { generateJson } from "@/lib/gemini";

const keywordMatchSchema = z.object({
  matchedKeywords: z.array(z.string()).optional().default([]),
  missingKeywords: z.array(z.string()).optional().default([]),
});

export interface KeywordMatchResult {
  matchedKeywords: string[];
  missingKeywords: string[];
  matchPercentage: number;
}

export async function matchKeywords(
  resumeText: string,
  jobPostingText: string
): Promise<KeywordMatchResult> {
  const prompt = `You are an ATS keyword matching engine. Compare the resume text against the job posting text below.

Hard rules:
- Identify the important hard skills, tools, and qualifications explicitly mentioned in the job posting.
- Only include keywords that are actually present in the job posting text. Never invent keywords.
- For each identified keyword, classify it as matched (it appears in the resume, allowing for common synonyms/abbreviations) or missing (it does not appear in the resume).
- Keep each keyword short (1-3 words).

Job posting:
"""
${jobPostingText.slice(0, 8000)}
"""

Resume:
"""
${resumeText.slice(0, 20000)}
"""`;

  const text = await generateJson({
    prompt,
    maxOutputTokens: 2048,
    schema: {
      type: Type.OBJECT,
      properties: {
        matchedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
        missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  });

  const parsed = keywordMatchSchema.parse(JSON.parse(text));
  const total = parsed.matchedKeywords.length + parsed.missingKeywords.length;
  const matchPercentage = total === 0 ? 0 : Math.round((parsed.matchedKeywords.length / total) * 100);

  return { ...parsed, matchPercentage };
}
