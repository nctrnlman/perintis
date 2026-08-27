"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveStatus } from "@/components/profile/save-status";
import type { AutoSaveStatus } from "@/hooks/use-auto-save-form";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { ResumeContent } from "@/lib/resume-builder/types";
import { updateResumeContent } from "@/app/[locale]/(app)/resume-builder/actions";
import { ContactInfoCard } from "@/components/resume-builder/contact-info-card";
import { SummaryCard } from "@/components/resume-builder/summary-card";
import { WorkExperienceSection } from "@/components/resume-builder/work-experience-section";
import { EducationSection } from "@/components/resume-builder/education-section";
import { SkillsSection } from "@/components/resume-builder/skills-section";
import { CertificationsSection } from "@/components/resume-builder/certifications-section";
import { LanguagesSection } from "@/components/resume-builder/languages-section";
import { ProjectsSection } from "@/components/resume-builder/projects-section";
import { ResumePreviewPanel } from "@/components/resume-builder/resume-preview-panel";
import { trackEvent } from "@/lib/analytics-events";

interface BuilderClientProps {
  id: string;
  token: string;
  initialTitle: string;
  initialContent: ResumeContent;
}

export function BuilderClient({ id, token, initialTitle, initialContent }: BuilderClientProps) {
  const t = useTranslations("resumeBuilder.builder");
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<ResumeContent>(initialContent);
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const isFirstRun = useRef(true);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedTitle = useDebouncedValue(title);
  const debouncedContent = useDebouncedValue(content);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (!debouncedTitle.trim()) return;
    if (savedTimer.current) clearTimeout(savedTimer.current);

    const timer = setTimeout(() => {
      setStatus("saving");
      updateResumeContent(id, debouncedTitle, debouncedContent).then((result) => {
        if ("error" in result) {
          trackEvent("resume_save_failed");
          setStatus("error");
          return;
        }
        trackEvent("resume_saved");
        setStatus("saved");
        savedTimer.current = setTimeout(() => setStatus("idle"), 2000);
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [id, debouncedTitle, debouncedContent]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <Link href="/resume-builder" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToList")}
        </Link>
        <SaveStatus status={status} namespace="resumeBuilder.builder" />
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="space-y-1.5">
            <Label htmlFor="rb-title">{t("titleLabel")}</Label>
            <Input id="rb-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <ContactInfoCard
            personalInfo={content.personalInfo}
            onChange={(personalInfo) => setContent({ ...content, personalInfo })}
          />
          <SummaryCard
            summary={content.summary}
            onChange={(summary) => setContent({ ...content, summary })}
          />
          <WorkExperienceSection
            entries={content.workExperiences}
            onChange={(workExperiences) => setContent({ ...content, workExperiences })}
          />
          <EducationSection
            entries={content.educations}
            onChange={(educations) => setContent({ ...content, educations })}
          />
          <SkillsSection
            entries={content.skills}
            onChange={(skills) => setContent({ ...content, skills })}
          />
          <ProjectsSection
            entries={content.projects}
            onChange={(projects) => setContent({ ...content, projects })}
          />
          <CertificationsSection
            entries={content.certifications}
            onChange={(certifications) => setContent({ ...content, certifications })}
          />
          <LanguagesSection
            entries={content.languages}
            onChange={(languages) => setContent({ ...content, languages })}
          />

          <div className="flex justify-end rounded-2xl border border-border p-6">
            <Button
              variant="outline"
              render={
                <a
                  href={`/resume-builder/${token}/pdf`}
                  download={`${title}.pdf`}
                  onClick={() => trackEvent("resume_pdf_export", { action: "download" })}
                />
              }
              nativeButton={false}
            >
              {t("downloadButton")}
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-5rem)] lg:self-start">
          <ResumePreviewPanel content={debouncedContent} />
        </div>
      </div>
    </div>
  );
}
