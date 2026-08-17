import { z } from "zod";

const personalInfoSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedinUrl: z.string(),
  portfolioUrl: z.string(),
});

const workExperienceEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
});

const educationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  fieldOfStudy: z.string(),
  location: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
});

const skillEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
});

const certificationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  issueDate: z.string().nullable(),
  url: z.string(),
});

const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  client: z.string(),
  role: z.string(),
  bullets: z.array(z.string()),
  techStack: z.array(z.string()),
});

const languageEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.string(),
});

export const resumeContentSchema = z.object({
  personalInfo: personalInfoSchema,
  summary: z.string(),
  workExperiences: z.array(workExperienceEntrySchema),
  educations: z.array(educationEntrySchema),
  skills: z.array(skillEntrySchema),
  certifications: z.array(certificationEntrySchema),
  projects: z.array(projectEntrySchema),
  languages: z.array(languageEntrySchema),
});

export type ResumeContentInput = z.infer<typeof resumeContentSchema>;
