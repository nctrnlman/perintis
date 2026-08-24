"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationStageValues,
} from "@/lib/validations/application-tracker";

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createApplication(
  formData: FormData
): Promise<{ token: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const parsed = createApplicationSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    stage: formData.get("stage") ?? "APPLIED",
    jobUrl: formData.get("jobUrl") ?? "",
    location: formData.get("location") ?? "",
    resumeDocumentId: formData.get("resumeDocumentId") ?? "",
    coverLetterId: formData.get("coverLetterId") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  const resumeDocumentId = emptyToNull(parsed.data.resumeDocumentId);
  const coverLetterId = emptyToNull(parsed.data.coverLetterId);

  if (resumeDocumentId) {
    const resume = await db.resumeDocument.findUnique({ where: { id: resumeDocumentId } });
    if (!resume || resume.userId !== user.id) return { error: "invalid-resume" };
  }
  if (coverLetterId) {
    const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });
    if (!coverLetter || coverLetter.userId !== user.id) return { error: "invalid-cover-letter" };
  }

  const application = await db.application.create({
    data: {
      userId: user.id,
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      stage: parsed.data.stage,
      jobUrl: emptyToNull(parsed.data.jobUrl),
      location: emptyToNull(parsed.data.location),
      resumeDocumentId,
      coverLetterId,
      appliedAt: parsed.data.stage === "WISHLIST" ? null : new Date(),
    },
  });

  revalidatePath("/application-tracker");
  return { token: encryptId(application.id) };
}

export async function updateApplicationFields(
  id: string,
  formData: FormData
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const parsed = updateApplicationSchema.safeParse({
    companyName: formData.get("companyName") ?? "",
    positionTitle: formData.get("positionTitle") ?? "",
    stage: formData.get("stage") ?? existing.stage,
    jobUrl: formData.get("jobUrl") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
    appliedAt: formData.get("appliedAt") ?? "",
    resumeDocumentId: formData.get("resumeDocumentId") ?? "",
    coverLetterId: formData.get("coverLetterId") ?? "",
  });
  if (!parsed.success) return { error: "validation-failed" };

  const resumeDocumentId = emptyToNull(parsed.data.resumeDocumentId);
  const coverLetterId = emptyToNull(parsed.data.coverLetterId);

  if (resumeDocumentId) {
    const resume = await db.resumeDocument.findUnique({ where: { id: resumeDocumentId } });
    if (!resume || resume.userId !== user.id) return { error: "invalid-resume" };
  }
  if (coverLetterId) {
    const coverLetter = await db.coverLetter.findUnique({ where: { id: coverLetterId } });
    if (!coverLetter || coverLetter.userId !== user.id) return { error: "invalid-cover-letter" };
  }

  const appliedAtInput = parsed.data.appliedAt?.trim();
  const nextAppliedAt = appliedAtInput
    ? new Date(appliedAtInput)
    : existing.stage === "WISHLIST" && parsed.data.stage !== "WISHLIST"
      ? new Date()
      : existing.appliedAt;

  await db.application.update({
    where: { id },
    data: {
      companyName: parsed.data.companyName,
      positionTitle: parsed.data.positionTitle,
      stage: parsed.data.stage,
      jobUrl: emptyToNull(parsed.data.jobUrl),
      location: emptyToNull(parsed.data.location),
      notes: emptyToNull(parsed.data.notes),
      resumeDocumentId,
      coverLetterId,
      appliedAt: nextAppliedAt,
    },
  });

  revalidatePath("/application-tracker");
  return { success: true };
}

export async function updateApplicationStage(
  id: string,
  stage: string
): Promise<{ success: true } | { error: string }> {
  if (!(applicationStageValues as readonly string[]).includes(stage)) {
    return { error: "invalid-stage" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  const nextAppliedAt =
    existing.appliedAt === null && stage !== "WISHLIST" ? new Date() : existing.appliedAt;

  await db.application.update({
    where: { id },
    data: {
      stage: stage as typeof existing.stage,
      appliedAt: nextAppliedAt,
    },
  });

  revalidatePath("/application-tracker");
  return { success: true };
}

export async function deleteApplication(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.application.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.application.delete({ where: { id } });
  revalidatePath("/application-tracker");
  return { success: true };
}
