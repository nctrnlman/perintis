import { GoogleGenAI } from "@google/genai";

// Free tier only — never fall back to a paid tier. gemini-3.6-flash has a
// very small daily quota (20 requests/day on the free tier); the fallback
// models below have a much larger free daily quota (500/day) for when the
// primary model is rate-limited or temporarily unavailable.
const PRIMARY_MODEL = "gemini-3.6-flash";
const FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];

function isRetryableStatus(err: unknown): boolean {
  const status = (err as { status?: number } | undefined)?.status;
  return status === 429 || status === 503;
}

interface GenerateJsonParams {
  prompt: string;
  schema: object;
  maxOutputTokens: number;
  thinkingBudget?: number;
}

export async function generateJson({
  prompt,
  schema,
  maxOutputTokens,
  thinkingBudget = 128,
}: GenerateJsonParams): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  async function attempt(model: string): Promise<string> {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget },
        maxOutputTokens,
        responseMimeType: "application/json",
        responseJsonSchema: schema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error(`Empty response from Gemini (${model})`);
    }
    return text;
  }

  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    try {
      return await attempt(models[i]);
    } catch (err) {
      lastError = err;
      const isLastModel = i === models.length - 1;
      if (isLastModel || !isRetryableStatus(err)) {
        throw err;
      }
      console.warn(`[gemini] ${models[i]} unavailable, falling back to ${models[i + 1]}`);
    }
  }

  throw lastError;
}
