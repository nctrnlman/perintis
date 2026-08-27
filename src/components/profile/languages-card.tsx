"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "@/components/ui/toast";
import { RequiredMark } from "@/components/shared/property-row";
import { addLanguage, deleteLanguage } from "@/app/[locale]/(app)/profile/actions";
import { proficiencyOptions, toComboboxOptions } from "@/lib/combobox-options";
import { trackEvent } from "@/lib/analytics-events";

interface LanguageItem {
  id: string;
  name: string;
  proficiency: string;
}

interface LanguagesCardProps {
  languages: LanguageItem[];
}

const COLLAPSE_THRESHOLD = 12;

export function LanguagesCard({ languages }: LanguagesCardProps) {
  const t = useTranslations("profile.languages");
  const locale = useLocale() as "id" | "en";
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [proficiency, setProficiency] = useState("");
  const visibleLanguages = expanded ? languages : languages.slice(0, COLLAPSE_THRESHOLD);
  const hiddenCount = languages.length - visibleLanguages.length;

  function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (name && languages.some((lang) => lang.name.toLowerCase() === name.toLowerCase())) {
      toast.add({ title: t("toastDuplicate"), type: "error" });
      return;
    }

    startTransition(async () => {
      const result = await addLanguage(formData);
      if ("error" in result) {
        trackEvent("profile_section_update_failed", { section: "language", action: "add" });
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      trackEvent("profile_section_updated", { section: "language", action: "add" });
      toast.add({ title: t("toastAddSuccess"), type: "success" });
      formRef.current?.reset();
      setProficiency("");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLanguage(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      trackEvent("profile_section_updated", { section: "language", action: "delete" });
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-6">
      <h2 className="text-xl font-semibold">
        {t("title")}
        {languages.length > 0 && (
          <span className="ml-1.5 text-sm font-normal text-muted-foreground">
            ({languages.length})
          </span>
        )}
      </h2>

      {languages.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleLanguages.map((lang) => (
              <span
                key={lang.id}
                className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm"
              >
                {lang.name} &middot; {lang.proficiency}
                <button
                  type="button"
                  onClick={() => handleDelete(lang.id)}
                  aria-label={t("toastDeleteSuccess")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          {languages.length > COLLAPSE_THRESHOLD && (
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

      <form ref={formRef} action={handleSubmit} className="mt-6 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="lang-name" className="text-xs text-muted-foreground">
              {t("nameLabel")} <RequiredMark />
            </label>
            <Input id="lang-name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">
              {t("proficiencyLabel")} <RequiredMark />
            </span>
            <Combobox
              value={proficiency}
              onChange={setProficiency}
              options={toComboboxOptions(proficiencyOptions[locale])}
            />
            <input type="hidden" name="proficiency" value={proficiency} readOnly />
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          <Plus className="size-4" />
          {t("addButton")}
        </Button>
      </form>
    </div>
  );
}
