import { z } from "zod";

export const extractedProfileSchema = z.object({
  personalInfo: z
    .object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedinUrl: z.string().optional(),
      portfolioUrl: z.string().optional(),
      summary: z.string().optional(),
    })
    .optional()
    .default({}),
  workExperiences: z
    .array(
      z.object({
        title: z.string().optional(),
        company: z.string().optional(),
        location: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        skillsUsed: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
  educations: z
    .array(
      z.object({
        institution: z.string().optional(),
        degree: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().optional(),
        issuer: z.string().optional(),
        issueDate: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string().optional(),
        client: z.string().optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        techStack: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
  languages: z
    .array(
      z.object({
        name: z.string().optional(),
        proficiency: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

export type ExtractedProfile = z.infer<typeof extractedProfileSchema>;
