"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EducationEntry } from "@/lib/resume-builder/types";

interface EducationSectionProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
}

function emptyEntry(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    location: "",
    startDate: null,
    endDate: null,
    bullets: [],
  };
}

export function EducationSection({ entries, onChange }: EducationSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<EducationEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    onChange([...entries, emptyEntry()]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("educationTitle")}</h2>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-institution-${entry.id}`}>{t("institutionLabel")}</Label>
                  <Input
                    id={`ed-institution-${entry.id}`}
                    value={entry.institution}
                    onChange={(e) => updateEntry(entry.id, { institution: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-degree-${entry.id}`}>{t("degreeLabel")}</Label>
                  <Input
                    id={`ed-degree-${entry.id}`}
                    value={entry.degree}
                    onChange={(e) => updateEntry(entry.id, { degree: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-field-${entry.id}`}>{t("fieldOfStudyLabel")}</Label>
                  <Input
                    id={`ed-field-${entry.id}`}
                    value={entry.fieldOfStudy}
                    onChange={(e) => updateEntry(entry.id, { fieldOfStudy: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-location-${entry.id}`}>{t("locationLabel")}</Label>
                  <Input
                    id={`ed-location-${entry.id}`}
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-start-${entry.id}`}>{t("startDateLabel")}</Label>
                  <Input
                    id={`ed-start-${entry.id}`}
                    type="date"
                    value={entry.startDate ?? ""}
                    onChange={(e) =>
                      updateEntry(entry.id, { startDate: e.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ed-end-${entry.id}`}>{t("endDateLabel")}</Label>
                  <Input
                    id={`ed-end-${entry.id}`}
                    type="date"
                    value={entry.endDate ?? ""}
                    onChange={(e) => updateEntry(entry.id, { endDate: e.target.value || null })}
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEntry(entry.id)}
                aria-label={t("removeEntryLabel")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
