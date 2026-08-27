import { UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ensureProfileRecord } from "@/lib/ensure-profile";
import { ImportResumeCard } from "@/components/profile/import-resume-card";
import { PersonalInfoCard } from "@/components/profile/personal-info-card";
import { WorkExperienceCard } from "@/components/profile/work-experience-card";
import { EducationCard } from "@/components/profile/education-card";
import { SkillsCard } from "@/components/profile/skills-card";
import { CertificationsCard } from "@/components/profile/certifications-card";
import { ProjectsCard } from "@/components/profile/projects-card";
import { LanguagesCard } from "@/components/profile/languages-card";

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
      certifications: { orderBy: { issueDate: "desc" } },
      projects: { orderBy: { createdAt: "asc" } },
      languages: { orderBy: { name: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <UserRound className="size-4" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("description")}</p>
          </div>
        </div>
        <ImportResumeCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <PersonalInfoCard profile={profile} />
        </div>
        <div className="lg:col-span-2">
          <WorkExperienceCard experiences={profile.workExperiences} />
        </div>
        <EducationCard educations={profile.educations} />
        <CertificationsCard certifications={profile.certifications} />
        <div className="lg:col-span-2">
          <ProjectsCard projects={profile.projects} />
        </div>
        <SkillsCard skills={profile.skills} />
        <LanguagesCard languages={profile.languages} />
      </div>
    </div>
  );
}
