import { Type } from "@google/genai";
import { generateJson } from "@/lib/gemini";
import { extractedProfileSchema, type ExtractedProfile } from "./types";

const STRING_ARRAY_SCHEMA = { type: Type.ARRAY, items: { type: Type.STRING } };

export async function extractProfileFromText(rawText: string): Promise<ExtractedProfile> {
  const prompt = `Extract structured resume/CV data from the following raw text.

Hard rules:
- Only include information that is actually present in the text. Never invent names, dates, companies, achievements, or metrics.
- Format every date as "YYYY-MM-DD". If only a year or year+month is known, use "01" for the missing day/month. If a role or study is still ongoing, leave endDate empty ("").
- If a field or section has no information in the text, leave it empty (empty string or empty array).

Raw resume text:
"""
${rawText.slice(0, 20000)}
"""`;

  const text = await generateJson({
    prompt,
    maxOutputTokens: 8192,
    schema: {
      type: Type.OBJECT,
      properties: {
        personalInfo: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING },
            phone: { type: Type.STRING },
            location: { type: Type.STRING },
            linkedinUrl: { type: Type.STRING },
            portfolioUrl: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
        },
        workExperiences: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
              description: { type: Type.STRING },
              skillsUsed: STRING_ARRAY_SCHEMA,
            },
          },
        },
        educations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              institution: { type: Type.STRING },
              degree: { type: Type.STRING },
              fieldOfStudy: { type: Type.STRING },
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING },
            },
          },
        },
        skills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
            },
          },
        },
        certifications: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              issuer: { type: Type.STRING },
              issueDate: { type: Type.STRING },
              url: { type: Type.STRING },
            },
          },
        },
        projects: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              client: { type: Type.STRING },
              role: { type: Type.STRING },
              description: { type: Type.STRING },
              techStack: STRING_ARRAY_SCHEMA,
            },
          },
        },
        languages: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              proficiency: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  return extractedProfileSchema.parse(JSON.parse(text));
}
