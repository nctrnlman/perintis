"use client";

import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LanguageEntry } from "@/lib/resume-builder/types";

interface LanguagesSectionProps {
  entries: LanguageEntry[];
  onChange: (entries: LanguageEntry[]) => void;
}

export function LanguagesSection({ entries, onChange }: LanguagesSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function addEntry(name: string, proficiency: string) {
    if (!name.trim() || !proficiency.trim()) return;
    onChange([...entries, { id: crypto.randomUUID(), name: name.trim(), proficiency: proficiency.trim() }]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("languagesTitle")}</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {entries.map((lang) => (
          <span
            key={lang.id}
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
          >
            {lang.name} &middot; {lang.proficiency}
            <button
              type="button"
              onClick={() => removeEntry(lang.id)}
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
          addEntry(String(formData.get("name") ?? ""), String(formData.get("proficiency") ?? ""));
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="rb-lang-name" className="text-xs text-muted-foreground">
            {t("nameLabel")}
          </label>
          <Input id="rb-lang-name" name="name" required className="w-40" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="rb-lang-proficiency" className="text-xs text-muted-foreground">
            {t("proficiencyLabel")}
          </label>
          <Input id="rb-lang-proficiency" name="proficiency" required className="w-40" />
        </div>
        <Button type="submit" variant="outline" size="sm">
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </form>
    </div>
  );
}
