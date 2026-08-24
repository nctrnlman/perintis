import { z } from "zod";

export const applicationStageValues = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
] as const;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || z.string().url().safeParse(value).success, {
    message: "URL tidak valid",
  })
  .optional();

export const createApplicationSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  stage: z.enum(applicationStageValues),
  jobUrl: optionalUrl,
  location: z.string().trim().optional(),
  resumeDocumentId: z.string().trim().optional(),
  coverLetterId: z.string().trim().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  stage: z.enum(applicationStageValues),
  jobUrl: optionalUrl,
  location: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  appliedAt: z.string().trim().optional(),
  resumeDocumentId: z.string().trim().optional(),
  coverLetterId: z.string().trim().optional(),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const addInterviewRoundSchema = z.object({
  label: z.string().min(1, "Nama tahap wajib diisi"),
  scheduledAt: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type AddInterviewRoundInput = z.infer<typeof addInterviewRoundSchema>;

export const updateRoundOutcomeSchema = z.object({
  outcome: z.enum(["PENDING", "PASSED", "FAILED"]),
});
