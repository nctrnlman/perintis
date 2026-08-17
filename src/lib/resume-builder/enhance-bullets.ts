import { GoogleGenAI, Type } from "@google/genai";

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
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Rewrite the following resume bullet points for a "${title}" role at "${company}" into polished, professional resume language.

Hard rules:
- Never invent achievements, metrics, or numbers that are not already present in the input bullets.
- Return exactly ${bullets.length} bullet(s), one rewritten version per input bullet, in the same order.
- Do not merge, split, summarize, or add bullets.

Input bullets:
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Malformed response shape from Gemini");
  }

  return parsed;
}
