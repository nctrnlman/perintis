"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PersonalInfo } from "@/lib/resume-builder/types";

interface ContactInfoCardProps {
  personalInfo: PersonalInfo;
  onChange: (personalInfo: PersonalInfo) => void;
}

export function ContactInfoCard({ personalInfo, onChange }: ContactInfoCardProps) {
  const t = useTranslations("resumeBuilder.builder");

  function handleFieldChange(field: keyof PersonalInfo, value: string) {
    onChange({ ...personalInfo, [field]: value });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("contactInfoTitle")}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rb-fullName">{t("fullNameLabel")}</Label>
          <Input
            id="rb-fullName"
            value={personalInfo.fullName}
            onChange={(e) => handleFieldChange("fullName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-email">{t("emailLabel")}</Label>
          <Input
            id="rb-email"
            value={personalInfo.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-phone">{t("phoneLabel")}</Label>
          <Input
            id="rb-phone"
            value={personalInfo.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-location">{t("locationLabel")}</Label>
          <Input
            id="rb-location"
            value={personalInfo.location}
            onChange={(e) => handleFieldChange("location", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-linkedin">{t("linkedinLabel")}</Label>
          <Input
            id="rb-linkedin"
            value={personalInfo.linkedinUrl}
            onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rb-portfolio">{t("portfolioLabel")}</Label>
          <Input
            id="rb-portfolio"
            value={personalInfo.portfolioUrl}
            onChange={(e) => handleFieldChange("portfolioUrl", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
