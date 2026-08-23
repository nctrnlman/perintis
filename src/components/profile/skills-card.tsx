"use client";

import { useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { addSkill, deleteSkill } from "@/app/[locale]/(app)/profile/actions";
import { trackEvent } from "@/lib/analytics-events";

interface SkillItem {
  id: string;
  name: string;
  category: string | null;
}

interface SkillsCardProps {
  skills: SkillItem[];
}

export function SkillsCard({ skills }: SkillsCardProps) {
  const t = useTranslations("profile.skills");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addSkill(formData);
      if ("error" in result) {
        trackEvent("profile_section_update_failed", { section: "skill", action: "add" });
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      trackEvent("profile_section_updated", { section: "skill", action: "add" });
      toast.add({ title: t("toastAddSuccess"), type: "success" });
      formRef.current?.reset();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteSkill(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      trackEvent("profile_section_updated", { section: "skill", action: "delete" });
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {skills.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => handleDelete(skill.id)}
                aria-label={t("toastDeleteSuccess")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <form ref={formRef} action={handleSubmit} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="skill-name" className="text-xs text-muted-foreground">
            {t("nameLabel")}
          </label>
          <Input id="skill-name" name="name" required />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {t("addButton")}
        </Button>
      </form>
    </div>
  );
}
