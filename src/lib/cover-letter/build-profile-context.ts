import { stripHtml } from "../resume-builder/strip-html";

export interface ProfileContextInput {
  summary: string | null;
  targetRole: string | null;
  targetIndustry: string | null;
  workExperiences: {
    title: string;
    company: string;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
  }[];
  educations: { institution: string; degree: string | null; fieldOfStudy: string | null }[];
  skills: { name: string }[];
  certifications: { name: string; issuer: string }[];
  projects: { name: string; role: string | null; description: string | null }[];
}

function descriptionLines(description: string | null): string[] {
  return stripHtml(description ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildProfileContext(profile: ProfileContextInput): string {
  const parts: string[] = [];

  if (profile.targetRole || profile.targetIndustry) {
    parts.push(
      `Target role: ${[profile.targetRole, profile.targetIndustry].filter(Boolean).join(" / ")}`
    );
  }

  if (profile.summary) {
    parts.push(`Summary: ${stripHtml(profile.summary)}`);
  }

  if (profile.workExperiences.length > 0) {
    const entries = profile.workExperiences
      .map((exp) => {
        const startYear = exp.startDate.getFullYear();
        const endYear = exp.endDate ? exp.endDate.getFullYear() : "Present";
        const lines = descriptionLines(exp.description);
        const detail = lines.length > 0 ? `\n  - ${lines.join("\n  - ")}` : "";
        return `- ${exp.title} at ${exp.company} (${startYear}-${endYear})${detail}`;
      })
      .join("\n");
    parts.push(`Work experience:\n${entries}`);
  }

  if (profile.educations.length > 0) {
    const entries = profile.educations
      .map((ed) =>
        `- ${[ed.degree, ed.fieldOfStudy].filter(Boolean).join(" ")} at ${ed.institution}`.trim()
      )
      .join("\n");
    parts.push(`Education:\n${entries}`);
  }

  if (profile.skills.length > 0) {
    parts.push(`Skills: ${profile.skills.map((s) => s.name).join(", ")}`);
  }

  if (profile.certifications.length > 0) {
    parts.push(
      `Certifications: ${profile.certifications.map((c) => `${c.name} (${c.issuer})`).join(", ")}`
    );
  }

  if (profile.projects.length > 0) {
    const entries = profile.projects
      .map((p) => {
        const bullets = descriptionLines(p.description);
        const detail = bullets.length > 0 ? `\n  - ${bullets.join("\n  - ")}` : "";
        return `- ${p.name}${p.role ? ` (${p.role})` : ""}${detail}`;
      })
      .join("\n");
    parts.push(`Projects:\n${entries}`);
  }

  return parts.join("\n\n");
}
