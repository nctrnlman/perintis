import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { buildCareerFitPrompt, type CareerFitPromptInput } from "./prompt";

export async function generateCareerFitReasoning(
  input: CareerFitPromptInput
): Promise<string[]> {
  const prompt = buildCareerFitPrompt(input);

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
    !parsed.every((item) => typeof item === "string") ||
    parsed.length !== input.matches.length
  ) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
