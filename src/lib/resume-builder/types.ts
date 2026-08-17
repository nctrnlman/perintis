export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl: string;
  portfolioUrl: string;
}

export interface WorkExperienceEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  bullets: string[];
}

export interface SkillEntry {
  id: string;
  name: string;
  category: string;
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  issueDate: string | null;
  url: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  client: string;
  role: string;
  bullets: string[];
  techStack: string[];
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: string;
}

export interface ResumeContent {
  personalInfo: PersonalInfo;
  summary: string;
  workExperiences: WorkExperienceEntry[];
  educations: EducationEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
}
