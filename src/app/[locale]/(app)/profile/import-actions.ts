"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { extractPdfText } from "@/lib/resume/pdf";
import { extractDocxText } from "@/lib/resume/docx";
import { extractProfileFromText } from "@/lib/resume-import/extract-profile";
import { buildPersonalInfoPatch } from "@/lib/resume-import/merge-profile";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function detectFileType(bytes: Uint8Array): "pdf" | "docx" | "unknown" {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "pdf";
  }
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    return "docx";
  }
  return "unknown";
}

function toDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function importResumeToProfile(
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const profile = await db.profile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "not-authenticated" };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "no-file" };
  if (file.size > MAX_FILE_SIZE) return { error: "too-large" };

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const fileType = detectFileType(bytes);
  if (fileType === "unknown") return { error: "unsupported-type" };

  let rawText: string;
  try {
    rawText =
      fileType === "pdf"
        ? await extractPdfText(arrayBuffer.slice(0))
        : await extractDocxText(arrayBuffer);
  } catch (err) {
    console.error("[profile-import] Failed to parse file:", err);
    return { error: "parsing-failed" };
  }

  if (!rawText.trim()) return { error: "parsing-failed" };

  let extracted;
  try {
    extracted = await extractProfileFromText(rawText);
  } catch (err) {
    console.error("[profile-import] Gemini extraction failed:", err);
    return { error: "extraction-failed" };
  }

  const personalInfoPatch = buildPersonalInfoPatch(profile, extracted.personalInfo);
  if (Object.keys(personalInfoPatch).length > 0) {
    await db.profile.update({ where: { id: profile.id }, data: personalInfoPatch });
  }

  const workExperiencesToCreate = extracted.workExperiences
    .filter((w) => w.title && w.company && toDate(w.startDate))
    .map((w) => ({
      profileId: profile.id,
      title: w.title!,
      company: w.company!,
      location: w.location || null,
      startDate: toDate(w.startDate)!,
      endDate: toDate(w.endDate),
      description: w.description || null,
      skillsUsed: w.skillsUsed,
    }));
  if (workExperiencesToCreate.length > 0) {
    await db.workExperience.createMany({ data: workExperiencesToCreate });
  }

  const educationsToCreate = extracted.educations
    .filter((e) => e.institution && toDate(e.startDate))
    .map((e) => ({
      profileId: profile.id,
      institution: e.institution!,
      degree: e.degree || null,
      fieldOfStudy: e.fieldOfStudy || null,
      startDate: toDate(e.startDate)!,
      endDate: toDate(e.endDate),
    }));
  if (educationsToCreate.length > 0) {
    await db.education.createMany({ data: educationsToCreate });
  }

  const skillsToCreate = extracted.skills
    .filter((s) => s.name)
    .map((s) => ({ profileId: profile.id, name: s.name!, category: s.category || null }));
  if (skillsToCreate.length > 0) {
    await db.skill.createMany({ data: skillsToCreate });
  }

  const certificationsToCreate = extracted.certifications
    .filter((c) => c.name && c.issuer)
    .map((c) => ({
      profileId: profile.id,
      name: c.name!,
      issuer: c.issuer!,
      issueDate: toDate(c.issueDate),
      url: c.url || null,
    }));
  if (certificationsToCreate.length > 0) {
    await db.certification.createMany({ data: certificationsToCreate });
  }

  const projectsToCreate = extracted.projects
    .filter((p) => p.name)
    .map((p) => ({
      profileId: profile.id,
      name: p.name!,
      client: p.client || null,
      role: p.role || null,
      description: p.description || null,
      techStack: p.techStack,
    }));
  if (projectsToCreate.length > 0) {
    await db.project.createMany({ data: projectsToCreate });
  }

  const languagesToCreate = extracted.languages
    .filter((l) => l.name && l.proficiency)
    .map((l) => ({ profileId: profile.id, name: l.name!, proficiency: l.proficiency! }));
  if (languagesToCreate.length > 0) {
    await db.language.createMany({ data: languagesToCreate });
  }

  revalidatePath("/profile");
  return { success: true };
}
