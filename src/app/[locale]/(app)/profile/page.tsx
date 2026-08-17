import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { PersonalInfoCard } from "@/components/profile/personal-info-card";
import { WorkExperienceCard } from "@/components/profile/work-experience-card";
import { EducationCard } from "@/components/profile/education-card";
import { SkillsCard } from "@/components/profile/skills-card";

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  await ensureProfileRecord(user.id);

  const profile = await db.profile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      workExperiences: { orderBy: { startDate: "desc" } },
      educations: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { name: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("description")}</p>
      </div>

      <PersonalInfoCard profile={profile} />
      <WorkExperienceCard experiences={profile.workExperiences} />
      <EducationCard educations={profile.educations} />
      <SkillsCard skills={profile.skills} />
    </div>
  );
}
