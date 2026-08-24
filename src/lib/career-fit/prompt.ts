export interface CareerFitPromptInput {
  profileContext: string;
  matches: {
    title: string;
    matchedSkills: string[];
    missingSkills: string[];
  }[];
}

export function buildCareerFitPrompt(input: CareerFitPromptInput): string {
  const roleList = input.matches
    .map((match, index) => {
      const matched = match.matchedSkills.join(", ") || "-";
      const missing = match.missingSkills.join(", ") || "-";
      return `${index + 1}. ${match.title}\n   Matched skills: ${matched}\n   Missing skills: ${missing}`;
    })
    .join("\n");

  return `A candidate's profile has already been matched against ${input.matches.length} role(s) below using a deterministic skill-matching algorithm. Write one short paragraph per role explaining why it is a good potential fit for this specific candidate, based only on their profile data.

Hard rules:
- Only reference experience, skills, and education explicitly present in the candidate profile data below.
- Never invent employers, metrics, or accomplishments not present in the input.
- Never state or imply anything about job-market demand, hiring volume, or salary for any role.
- Return exactly ${input.matches.length} paragraph(s), one per role listed below, in the same order.

Roles already matched (do not add, remove, or reorder):
${roleList}

Candidate profile:
${input.profileContext}`;
}
