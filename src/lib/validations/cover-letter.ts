import { z } from "zod";

export const generateCoverLetterSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  jobPostingText: z.string().min(1, "Deskripsi lowongan wajib diisi"),
  tone: z.enum(["formal", "casual"]),
  length: z.enum(["short", "standard"]),
});

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

export const updateCoverLetterSchema = z.object({
  companyName: z.string().min(1, "Nama perusahaan wajib diisi"),
  positionTitle: z.string().min(1, "Posisi wajib diisi"),
  bodyHtml: z.string(),
});

export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;
