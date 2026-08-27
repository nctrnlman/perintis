"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { RequiredMark } from "@/components/shared/property-row";
import type { LanguageEntry } from "@/lib/resume-builder/types";
import { proficiencyOptions, toComboboxOptions } from "@/lib/combobox-options";

interface LanguagesSectionProps {
  entries: LanguageEntry[];
  onChange: (entries: LanguageEntry[]) => void;
}

export function LanguagesSection({ entries, onChange }: LanguagesSectionProps) {
  const t = useTranslations("resumeBuilder.builder");
  const locale = useLocale() as "id" | "en";
  const [proficiency, setProficiency] = useState("");

  function addEntry(name: string, proficiencyValue: string) {
    if (!name.trim() || !proficiencyValue.trim()) return;
    onChange([
      ...entries,
      { id: crypto.randomUUID(), name: name.trim(), proficiency: proficiencyValue.trim() },
    ]);
    setProficiency("");
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
          addEntry(String(formData.get("name") ?? ""), proficiency);
        }}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <div className="space-y-1.5">
          <label htmlFor="rb-lang-name" className="text-xs text-muted-foreground">
            {t("nameLabel")} <RequiredMark />
          </label>
          <Input id="rb-lang-name" name="name" required className="w-40" />
        </div>
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">
            {t("proficiencyLabel")} <RequiredMark />
          </span>
          <Combobox
            value={proficiency}
            onChange={setProficiency}
            options={toComboboxOptions(proficiencyOptions[locale])}
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
