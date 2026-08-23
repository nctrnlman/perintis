"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/resume-builder/rich-text-editor";
import { useAutoSaveForm } from "@/hooks/use-auto-save-form";
import { SaveStatus } from "@/components/profile/save-status";
import { updatePersonalInfo } from "@/app/[locale]/(app)/profile/actions";
import { trackEvent } from "@/lib/analytics-events";

interface PersonalInfoCardProps {
  profile: {
    fullName: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    targetRole: string | null;
    targetIndustry: string | null;
    summary: string | null;
  };
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm">
        {value || <span className="text-muted-foreground">-</span>}
      </p>
    </div>
  );
}

export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  const t = useTranslations("profile.personalInfo");
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(profile.summary ?? "");
  const { formRef, status, handleChange } = useAutoSaveForm(updatePersonalInfo);

  const hasAnyValue = Boolean(
    profile.fullName ||
      profile.phone ||
      profile.location ||
      profile.linkedinUrl ||
      profile.portfolioUrl ||
      profile.summary ||
      profile.targetRole ||
      profile.targetIndustry
  );

  if (!editing) {
    return (
      <div className="rounded-2xl border border-border p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={t("edit")}>
            <Pencil className="size-4" />
          </Button>
        </div>

        {!hasAnyValue ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("empty")}
          </button>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="mt-6 block w-full text-left">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow label={t("fullNameLabel")} value={profile.fullName} />
              <InfoRow label={t("phoneLabel")} value={profile.phone} />
              <InfoRow label={t("locationLabel")} value={profile.location} />
              <InfoRow label={t("linkedinLabel")} value={profile.linkedinUrl} />
              <InfoRow label={t("portfolioLabel")} value={profile.portfolioUrl} />
            </div>

            {profile.summary && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">{t("summaryLabel")}</p>
                <div
                  className="mt-1 text-sm text-foreground [&_li_p]:inline [&_p]:m-0 [&_ul]:my-0 [&_ul]:list-disc [&_ul]:list-outside [&_ul]:space-y-0.5 [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: profile.summary }}
                />
              </div>
            )}

            {(profile.targetRole || profile.targetIndustry) && (
              <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                <InfoRow label={t("targetRoleLabel")} value={profile.targetRole} />
                <InfoRow label={t("targetIndustryLabel")} value={profile.targetIndustry} />
              </div>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <div className="flex items-center gap-3">
          <SaveStatus status={status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              trackEvent("profile_personal_info_updated");
              setEditing(false);
            }}
          >
            {t("close")}
          </Button>
        </div>
      </div>

      <form ref={formRef} onChange={handleChange} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
            <Input id="fullName" name="fullName" defaultValue={profile.fullName ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("phoneLabel")}</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">{t("locationLabel")}</Label>
            <Input id="location" name="location" defaultValue={profile.location ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedinUrl">{t("linkedinLabel")}</Label>
            <Input
              id="linkedinUrl"
              name="linkedinUrl"
              defaultValue={profile.linkedinUrl ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="portfolioUrl">{t("portfolioLabel")}</Label>
            <Input
              id="portfolioUrl"
              name="portfolioUrl"
              defaultValue={profile.portfolioUrl ?? ""}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t("summaryLabel")}</Label>
          <RichTextEditor
            value={summary}
            onChange={(html) => {
              setSummary(html);
              handleChange();
            }}
            boldLabel={t("boldLabel")}
            italicLabel={t("italicLabel")}
          />
          <input type="hidden" name="summary" value={summary} readOnly />
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            {t("targetCareerTitle")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="targetRole">{t("targetRoleLabel")}</Label>
              <Input id="targetRole" name="targetRole" defaultValue={profile.targetRole ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetIndustry">{t("targetIndustryLabel")}</Label>
              <Input
                id="targetIndustry"
                name="targetIndustry"
                defaultValue={profile.targetIndustry ?? ""}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
