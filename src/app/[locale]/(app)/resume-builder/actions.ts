"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { buildContentFromProfile } from "@/lib/resume-builder/build-content";
import { resumeContentSchema, type ResumeContentInput } from "@/lib/validations/resume-content";

export async function createResumeDocument(): Promise<
  { token: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };

  await ensureProfileRecord(user.id);

  const profile = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      workExperiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { name: "asc" } },
      certifications: { orderBy: { issueDate: "desc" } },
      projects: { orderBy: { createdAt: "asc" } },
      languages: { orderBy: { name: "asc" } },
    },
  });

  const content = buildContentFromProfile(profile, user.email ?? "");

  const resumeDocument = await db.resumeDocument.create({
    data: {
      userId: user.id,
      title: "Resume Baru",
      content: JSON.parse(JSON.stringify(content)),
    },
  });

  return { token: encryptId(resumeDocument.id) };
}

export async function deleteResumeDocument(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };

  const existing = await db.resumeDocument.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.resumeDocument.delete({ where: { id } });
  revalidatePath("/resume-builder");
  return { success: true };
}

export async function updateResumeContent(
  id: string,
  title: string,
  content: ResumeContentInput
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "not-authenticated" };

  const existing = await db.resumeDocument.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const parsed = resumeContentSchema.safeParse(content);
  if (!parsed.success) return { error: "validation-failed" };

  if (!title.trim()) return { error: "validation-failed" };

  await db.resumeDocument.update({
    where: { id },
    data: {
      title,
      content: JSON.parse(JSON.stringify(parsed.data)),
    },
  });

  revalidatePath("/resume-builder");
  return { success: true };
}
