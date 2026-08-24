"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { encryptId } from "@/lib/id-crypto";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { buildProfileContext } from "@/lib/cover-letter/build-profile-context";
import { matchRoles } from "@/lib/career-fit/match-roles";
import { ROLE_TAXONOMY } from "@/lib/career-fit/role-taxonomy";
import { generateCareerFitReasoning } from "@/lib/career-fit/generate-reasoning";

export async function createPotentialAnalysis(): Promise<
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
    },
  });

  const skillNames = profile.skills.map((skill) => skill.name);
  const experienceSkills = profile.workExperiences.flatMap((exp) => exp.skillsUsed);
  const userSkills = [...skillNames, ...experienceSkills];

  const matches = matchRoles(userSkills, ROLE_TAXONOMY);
  if (matches.length === 0) {
    return { error: "no-skills" };
  }

  const profileContext = buildProfileContext(profile);

  let reasoning: string[];
  try {
    reasoning = await generateCareerFitReasoning({
      profileContext,
      matches: matches.map((match) => ({
        title: match.title,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
      })),
    });
  } catch (err) {
    console.error("[career-fit] Failed to generate reasoning:", err);
    return { error: "generation-failed" };
  }

  const results = matches.map((match, index) => ({
    roleId: match.roleId,
    title: match.title,
    category: match.category,
    tier: match.tier,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    reasoning: reasoning[index],
  }));

  const analysis = await db.potentialAnalysis.create({
    data: { userId: user.id, results },
  });

  revalidatePath("/career-fit");
  return { token: encryptId(analysis.id) };
}

export async function deletePotentialAnalysis(
  id: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not-authenticated" };

  const existing = await db.potentialAnalysis.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) return { error: "not-found" };

  await db.potentialAnalysis.delete({ where: { id } });
  revalidatePath("/career-fit");
  return { success: true };
}
