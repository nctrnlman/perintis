"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { updatePersonalInfo } from "@/app/[locale]/(app)/profile/actions";

interface PersonalInfoCardProps {
  profile: {
    fullName: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    targetRole: string | null;
    targetIndustry: string | null;
  };
}

export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  const t = useTranslations("profile.personalInfo");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updatePersonalInfo(formData);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      <form action={handleSubmit} className="mt-6 space-y-6">
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

        <Button type="submit" disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </div>
  );
}
