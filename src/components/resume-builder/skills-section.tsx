"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { RequiredMark } from "@/components/shared/property-row";
import type { SkillEntry } from "@/lib/resume-builder/types";
import { skillCategoryOptions, toComboboxOptions } from "@/lib/combobox-options";

interface SkillsSectionProps {
  entries: SkillEntry[];
  onChange: (entries: SkillEntry[]) => void;
}

export function SkillsSection({ entries, onChange }: SkillsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");
  const locale = useLocale() as "id" | "en";
  const [category, setCategory] = useState("");

  function addEntry(name: string, categoryValue: string) {
    if (!name.trim()) return;
    onChange([...entries, { id: crypto.randomUUID(), name: name.trim(), category: categoryValue }]);
    setCategory("");
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("skillsTitle")}</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {entries.map((skill) => (
          <span
            key={skill.id}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
          >
            {skill.name}
            <button
              type="button"
              onClick={() => removeEntry(skill.id)}
              aria-label={t("removeEntryLabel")}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
      </div>

      <form
        action={(formData) => {
          addEntry(String(formData.get("name") ?? ""), category);
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="rb-skill-name" className="text-xs text-muted-foreground">
            {t("nameLabel")} <RequiredMark />
          </label>
          <Input id="rb-skill-name" name="name" required className="w-40" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">{t("categoryLabel")}</span>
          <Combobox
            value={category}
            onChange={setCategory}
            options={toComboboxOptions(skillCategoryOptions[locale])}
            className="w-40"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </form>
    </div>
  );
}
