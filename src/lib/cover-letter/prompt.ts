export type CoverLetterTone = "formal" | "casual";
export type CoverLetterLength = "short" | "standard";

function toneInstruction(tone: CoverLetterTone): string {
  return tone === "casual"
    ? "Use a warm, personable tone, while staying respectful and professional."
    : "Use a formal and professional tone.";
}

function lengthInstruction(length: CoverLetterLength): string {
  return length === "short"
    ? "Target length: 150-200 words, 2-3 paragraphs."
    : "Target length: 250-350 words, 3-4 paragraphs.";
}

export interface BuildCoverLetterPromptInput {
  companyName: string;
  positionTitle: string;
  jobPostingText: string;
  tone: CoverLetterTone;
  length: CoverLetterLength;
  fullName: string | null;
  profileContext: string;
}

export function buildCoverLetterPrompt(input: BuildCoverLetterPromptInput): string {
  const closingInstruction = input.fullName
    ? `End with a polite closing line and the candidate's name, "${input.fullName}".`
    : "End with a polite closing line, without a name (the candidate's name is not available).";

  return `Write a complete cover letter for the position "${input.positionTitle}" at "${input.companyName}", based on the candidate profile data and the job posting below.

${toneInstruction(input.tone)}
${lengthInstruction(input.length)}
Write the letter in the same language as the job posting text below.
Start with a greeting addressed to the hiring team at "${input.companyName}".
${closingInstruction}

Hard rules:
- Only reference experience, skills, and achievements that are explicitly present in the candidate profile data below.
- Never invent metrics, employers, job titles, or accomplishments not present in the input.
- Return each paragraph as a separate string in the array, in the order they should appear (the greeting is its own paragraph, the closing is its own paragraph).

Candidate profile:
${input.profileContext}

Job posting:
${input.jobPostingText}`;
}
