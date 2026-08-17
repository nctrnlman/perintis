import type {
  CertificationEntry,
  EducationEntry,
  LanguageEntry,
  ProjectEntry,
  ResumeContent,
  SkillEntry,
  WorkExperienceEntry,
} from "./types";

interface ProfileWithRelations {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
  summary: string | null;
  workExperiences: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    description: string | null;
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string | null;
    fieldOfStudy: string | null;
    startDate: Date;
    endDate: Date | null;
  }>;
  skills: Array<{ id: string; name: string; category: string | null }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: Date | null;
    url: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    client: string | null;
    role: string | null;
    bullets: string[];
    techStack: string[];
  }>;
  languages: Array<{ id: string; name: string; proficiency: string }>;
}

function toDateString(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function splitBullets(description: string | null): string[] {
  if (!description) return [];
  return description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function buildContentFromProfile(
  profile: ProfileWithRelations,
  email: string
): ResumeContent {
  const workExperiences: WorkExperienceEntry[] = profile.workExperiences.map((we) => ({
    id: we.id,
    title: we.title,
    company: we.company,
    location: we.location ?? "",
    startDate: toDateString(we.startDate),
    endDate: toDateString(we.endDate),
    bullets: splitBullets(we.description),
  }));

  const educations: EducationEntry[] = profile.educations.map((ed) => ({
    id: ed.id,
    institution: ed.institution,
    degree: ed.degree ?? "",
    fieldOfStudy: ed.fieldOfStudy ?? "",
    location: "",
    startDate: toDateString(ed.startDate),
    endDate: toDateString(ed.endDate),
    bullets: [],
  }));

  const skills: SkillEntry[] = profile.skills.map((sk) => ({
    id: sk.id,
    name: sk.name,
    category: sk.category ?? "",
  }));

  const certifications: CertificationEntry[] = profile.certifications.map((ce) => ({
    id: ce.id,
    name: ce.name,
    issuer: ce.issuer,
    issueDate: toDateString(ce.issueDate),
    url: ce.url ?? "",
  }));

  const projects: ProjectEntry[] = profile.projects.map((pr) => ({
    id: pr.id,
    name: pr.name,
    client: pr.client ?? "",
    role: pr.role ?? "",
    bullets: pr.bullets,
    techStack: pr.techStack,
  }));

  const languages: LanguageEntry[] = profile.languages.map((la) => ({
    id: la.id,
    name: la.name,
    proficiency: la.proficiency,
  }));

  return {
    personalInfo: {
      fullName: profile.fullName ?? "",
      email,
      phone: profile.phone ?? "",
      location: profile.location ?? "",
      linkedinUrl: profile.linkedinUrl ?? "",
      portfolioUrl: profile.portfolioUrl ?? "",
    },
    summary: profile.summary ?? "",
    workExperiences,
    educations,
    skills,
    certifications,
    projects,
    languages,
  };
}
