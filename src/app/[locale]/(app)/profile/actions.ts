"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  certificationSchema,
  educationSchema,
  languageSchema,
  personalInfoSchema,
  projectSchema,
  skillSchema,
  workExperienceSchema,
} from "@/lib/validations/profile";

async function getOwnedProfileId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  return profile?.id ?? null;
}

function parseSkillsUsed(formData: FormData): string[] {
  const raw = formData.get("skillsUsed");
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function updatePersonalInfo(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = personalInfoSchema.safeParse({
    fullName: formData.get("fullName") ?? "",
    phone: formData.get("phone") ?? "",
    location: formData.get("location") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
    portfolioUrl: formData.get("portfolioUrl") ?? "",
    targetRole: formData.get("targetRole") ?? "",
    targetIndustry: formData.get("targetIndustry") ?? "",
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.profile.update({ where: { id: profileId }, data: parsed.data });
  revalidatePath("/profile");
  return { success: true };
}

export async function addWorkExperience(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = workExperienceSchema.safeParse({
    title: formData.get("title") ?? "",
    company: formData.get("company") ?? "",
    location: formData.get("location") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") || undefined,
    description: formData.get("description") ?? "",
    skillsUsed: parseSkillsUsed(formData),
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.workExperience.create({
    data: {
      profileId,
      title: parsed.data.title,
      company: parsed.data.company,
      location: parsed.data.location || null,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      description: parsed.data.description || null,
      skillsUsed: parsed.data.skillsUsed,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateWorkExperience(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.workExperience.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  const parsed = workExperienceSchema.safeParse({
    title: formData.get("title") ?? "",
    company: formData.get("company") ?? "",
    location: formData.get("location") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") || undefined,
    description: formData.get("description") ?? "",
    skillsUsed: parseSkillsUsed(formData),
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.workExperience.update({
    where: { id },
    data: {
      title: parsed.data.title,
      company: parsed.data.company,
      location: parsed.data.location || null,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      description: parsed.data.description || null,
      skillsUsed: parsed.data.skillsUsed,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteWorkExperience(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.workExperience.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.workExperience.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

export async function addEducation(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = educationSchema.safeParse({
    institution: formData.get("institution") ?? "",
    degree: formData.get("degree") ?? "",
    fieldOfStudy: formData.get("fieldOfStudy") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.education.create({
    data: {
      profileId,
      institution: parsed.data.institution,
      degree: parsed.data.degree || null,
      fieldOfStudy: parsed.data.fieldOfStudy || null,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateEducation(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.education.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  const parsed = educationSchema.safeParse({
    institution: formData.get("institution") ?? "",
    degree: formData.get("degree") ?? "",
    fieldOfStudy: formData.get("fieldOfStudy") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") || undefined,
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.education.update({
    where: { id },
    data: {
      institution: parsed.data.institution,
      degree: parsed.data.degree || null,
      fieldOfStudy: parsed.data.fieldOfStudy || null,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteEducation(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.education.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.education.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

export async function addSkill(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = skillSchema.safeParse({
    name: formData.get("name") ?? "",
    category: formData.get("category") ?? "",
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.skill.create({
    data: {
      profileId,
      name: parsed.data.name,
      category: parsed.data.category || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteSkill(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.skill.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.skill.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

function parseTechStack(formData: FormData): string[] {
  const raw = formData.get("techStack");
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBullets(formData: FormData): string[] {
  const raw = formData.get("bullets");
  if (typeof raw !== "string" || !raw.trim()) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function addCertification(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = certificationSchema.safeParse({
    name: formData.get("name") ?? "",
    issuer: formData.get("issuer") ?? "",
    issueDate: formData.get("issueDate") || undefined,
    url: formData.get("url") ?? "",
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.certification.create({
    data: {
      profileId,
      name: parsed.data.name,
      issuer: parsed.data.issuer,
      issueDate: parsed.data.issueDate ? new Date(parsed.data.issueDate) : null,
      url: parsed.data.url || null,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteCertification(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.certification.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.certification.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

export async function addProject(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name") ?? "",
    client: formData.get("client") ?? "",
    role: formData.get("role") ?? "",
    bullets: parseBullets(formData),
    techStack: parseTechStack(formData),
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.project.create({
    data: {
      profileId,
      name: parsed.data.name,
      client: parsed.data.client || null,
      role: parsed.data.role || null,
      bullets: parsed.data.bullets,
      techStack: parsed.data.techStack,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function updateProject(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  const parsed = projectSchema.safeParse({
    name: formData.get("name") ?? "",
    client: formData.get("client") ?? "",
    role: formData.get("role") ?? "",
    bullets: parseBullets(formData),
    techStack: parseTechStack(formData),
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.project.update({
    where: { id },
    data: {
      name: parsed.data.name,
      client: parsed.data.client || null,
      role: parsed.data.role || null,
      bullets: parsed.data.bullets,
      techStack: parsed.data.techStack,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteProject(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.project.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}

export async function addLanguage(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const parsed = languageSchema.safeParse({
    name: formData.get("name") ?? "",
    proficiency: formData.get("proficiency") ?? "",
  });

  if (!parsed.success) return { error: "validation-failed" };

  await db.language.create({
    data: {
      profileId,
      name: parsed.data.name,
      proficiency: parsed.data.proficiency,
    },
  });

  revalidatePath("/profile");
  return { success: true };
}

export async function deleteLanguage(
  id: string
): Promise<{ success: true } | { error: string }> {
  const profileId = await getOwnedProfileId();
  if (!profileId) return { error: "not-authenticated" };

  const existing = await db.language.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) return { error: "not-found" };

  await db.language.delete({ where: { id } });
  revalidatePath("/profile");
  return { success: true };
}
