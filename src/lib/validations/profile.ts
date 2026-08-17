import { z } from "zod";

export const personalInfoSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.union([z.string().url(), z.literal("")]).optional(),
  portfolioUrl: z.union([z.string().url(), z.literal("")]).optional(),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional(),
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

export const workExperienceSchema = z
  .object({
    title: z.string().min(1, "Judul wajib diisi"),
    company: z.string().min(1, "Perusahaan wajib diisi"),
    location: z.string().optional(),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().optional(),
    description: z.string().optional(),
    skillsUsed: z.array(z.string()).default([]),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["endDate"],
  });

export type WorkExperienceInput = z.infer<typeof workExperienceSchema>;

export const educationSchema = z
  .object({
    institution: z.string().min(1, "Institusi wajib diisi"),
    degree: z.string().optional(),
    fieldOfStudy: z.string().optional(),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().optional(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "Tanggal selesai harus setelah tanggal mulai",
    path: ["endDate"],
  });

export type EducationInput = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: z.string().min(1, "Nama skill wajib diisi"),
  category: z.string().optional(),
});

export type SkillInput = z.infer<typeof skillSchema>;
