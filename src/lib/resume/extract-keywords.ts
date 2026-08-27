import { Type } from "@google/genai";
import { z } from "zod";
import { generateJson } from "@/lib/gemini";

const resumeKeywordsSchema = z.object({
  technicalSkills: z.array(z.string()).optional().default([]),
  tools: z.array(z.string()).optional().default([]),
  certifications: z.array(z.string()).optional().default([]),
  softSkills: z.array(z.string()).optional().default([]),
});

export type ResumeKeywords = z.infer<typeof resumeKeywordsSchema>;

export async function extractResumeKeywords(rawText: string): Promise<ResumeKeywords> {
  const prompt = `You are an ATS keyword scanner. Extract the searchable keywords a recruiter's ATS system would index from the resume text below, grouped into categories.

Hard rules:
- Only include terms that are actually present in the text. Never invent skills, tools, or certifications.
- technicalSkills: hard/technical skills (programming languages, methodologies, domain expertise).
- tools: named software, platforms, or tools (e.g. Figma, Salesforce, Docker).
- certifications: named certifications, licenses, or credentials.
- softSkills: soft skills explicitly mentioned or clearly demonstrated (e.g. leadership, communication).
- Keep each keyword short (1-4 words). Do not duplicate a term across categories.

Resume text:
"""
${rawText.slice(0, 20000)}
"""`;

  const text = await generateJson({
    prompt,
    maxOutputTokens: 2048,
    schema: {
      type: Type.OBJECT,
      properties: {
        technicalSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        tools: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
        softSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
  });

  return resumeKeywordsSchema.parse(JSON.parse(text));
}
