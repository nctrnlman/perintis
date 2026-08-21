import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { buildCoverLetterPrompt, type CoverLetterLength, type CoverLetterTone } from "./prompt";

export interface GenerateCoverLetterBodyInput {
  companyName: string;
  positionTitle: string;
  jobPostingText: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  fullName: string | null;
  profileContext: string;
}

export async function generateCoverLetterBody(
  input: GenerateCoverLetterBodyInput
): Promise<string[]> {
  const prompt = buildCoverLetterPrompt(input);

  const text = await generateJson({
    prompt,
    maxOutputTokens: 1024,
    schema: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  });

  const parsed = JSON.parse(text);
  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    !parsed.every((item) => typeof item === "string")
  ) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
