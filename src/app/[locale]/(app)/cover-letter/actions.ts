"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { generateCoverLetterSchema, updateCoverLetterSchema } from "@/lib/validations/cover-letter";
import { buildProfileContext } from "@/lib/cover-letter/build-profile-context";
import { generateCoverLetterBody } from "@/lib/cover-letter/generate-letter";
import { paragraphsToHtml } from "@/lib/cover-letter/paragraphs-to-html";

export async function generateCoverLetter(
  formData: FormData
): Promise<{ token: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const parsed = generateCoverLetterSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    jobPostingText: formData.get("jobPostingText") ?? "",
    tone: formData.get("tone") ?? "formal",
    length: formData.get("length") ?? "standard",
  });
  if (!parsed.success) return { error: "validation-failed" };

  await ensureProfileRecord(user.id);
  const profile = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      workExperiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { name: "asc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      projects: { orderBy: { createdAt: "asc" } },
    },
  });

  const profileContext = buildProfileContext(profile);

  let paragraphs: string[];
  try {
    paragraphs = await generateCoverLetterBody({
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      jobPostingText: parsed.data.jobPostingText,
      tone: parsed.data.tone,
      length: parsed.data.length,
      fullName: profile.fullName,
      profileContext,
    });
  } catch (err) {
    console.error("[cover-letter] Failed to generate letter:", err);
    return { error: "generation-failed" };
  }

  const coverLetter = await db.coverLetter.create({
    data: {
      userId: user.id,
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      jobPostingText: parsed.data.jobPostingText,
      tone: parsed.data.tone,
      length: parsed.data.length,
      bodyHtml: paragraphsToHtml(paragraphs),
    },
  });

  return { token: encryptId(coverLetter.id) };
}

export async function updateCoverLetterFields(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.coverLetter.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const parsed = updateCoverLetterSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    bodyHtml: formData.get("bodyHtml") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  await db.coverLetter.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/cover-letter");
  return { success: true };
}

export async function deleteCoverLetter(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.coverLetter.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.coverLetter.delete({ where: { id } });
  revalidatePath("/cover-letter");
  return { success: true };
}
