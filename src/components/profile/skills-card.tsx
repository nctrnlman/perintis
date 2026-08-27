"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { RequiredMark } from "@/components/shared/property-row";
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

const COLLAPSE_THRESHOLD = 12;

export function SkillsCard({ skills }: SkillsCardProps) {
  const t = useTranslations("profile.skills");
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const visibleSkills = expanded ? skills : skills.slice(0, COLLAPSE_THRESHOLD);
  const hiddenCount = skills.length - visibleSkills.length;

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (name && skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      toast.add({ title: t("toastDuplicate"), type: "error" });
      return;
    }

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
    <div className="rounded-2xl border border-border p-6">
      <h2 className="text-xl font-semibold">
        {t("title")}
        {skills.length > 0 && (
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            ({skills.length})
          </span>
        )}
      </h2>

      {skills.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleSkills.map((skill) => (
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
          {skills.length > COLLAPSE_THRESHOLD && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {expanded ? t("showLess") : t("showMore", { count: hiddenCount })}
            </button>
          )}
        </>
      )}

      <form ref={formRef} action={handleSubmit} className="mt-6 flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="skill-name" className="text-xs text-muted-foreground">
            {t("nameLabel")} <RequiredMark />
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
