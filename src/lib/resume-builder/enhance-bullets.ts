import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { stripHtml } from "./strip-html";

interface EnhanceBulletsInput {
  title: string;
  company: string;
  bullets: string[];
}

export async function enhanceBullets({
  title,
  company,
  bullets,
}: EnhanceBulletsInput): Promise<string[]> {
  const plainBullets = bullets.map(stripHtml);

  const prompt = `Rewrite the following resume bullet points for a "${title}" role at "${company}" into polished, professional resume language.

Hard rules:
- Never invent achievements, metrics, or numbers that are not already present in the input bullets.
- Return exactly ${plainBullets.length} bullet(s), one rewritten version per input bullet, in the same order.
- Do not merge, split, summarize, or add bullets.

Input bullets:
${plainBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

  const text = await generateJson({
    prompt,
    maxOutputTokens: 512,
    schema: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  });

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
