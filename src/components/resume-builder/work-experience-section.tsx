"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkExperienceEntry } from "@/lib/resume-builder/types";

interface WorkExperienceSectionProps {
  entries: WorkExperienceEntry[];
  onChange: (entries: WorkExperienceEntry[]) => void;
}

function emptyEntry(): WorkExperienceEntry {
  return {
    id: crypto.randomUUID(),
    title: "",
    company: "",
    location: "",
    startDate: null,
    endDate: null,
    bullets: [],
  };
}

export function WorkExperienceSection({ entries, onChange }: WorkExperienceSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<WorkExperienceEntry>) {
    onChange(entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function addEntry() {
    onChange([...entries, emptyEntry()]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  function updateBullet(entryId: string, index: number, value: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const bullets = entry.bullets.map((b, i) => (i === index ? value : b));
    updateEntry(entryId, { bullets });
  }

  function addBullet(entryId: string) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: [...entry.bullets, ""] });
  }

  function removeBullet(entryId: string, index: number) {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    updateEntry(entryId, { bullets: entry.bullets.filter((_, i) => i !== index) });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("workExperienceTitle")}</h2>
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
                  <Label htmlFor={`we-title-${entry.id}`}>{t("titleLabelField")}</Label>
                  <Input
                    id={`we-title-${entry.id}`}
                    value={entry.title}
                    onChange={(e) => updateEntry(entry.id, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`we-company-${entry.id}`}>{t("companyLabel")}</Label>
                  <Input
                    id={`we-company-${entry.id}`}
                    value={entry.company}
                    onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`we-location-${entry.id}`}>{t("locationLabel")}</Label>
                  <Input
                    id={`we-location-${entry.id}`}
                    value={entry.location}
                    onChange={(e) => updateEntry(entry.id, { location: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`we-start-${entry.id}`}>{t("startDateLabel")}</Label>
                    <Input
                      id={`we-start-${entry.id}`}
                      type="date"
                      value={entry.startDate ?? ""}
                      onChange={(e) =>
                        updateEntry(entry.id, { startDate: e.target.value || null })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`we-end-${entry.id}`}>{t("endDateLabel")}</Label>
                    <Input
                      id={`we-end-${entry.id}`}
                      type="date"
                      value={entry.endDate ?? ""}
                      onChange={(e) => updateEntry(entry.id, { endDate: e.target.value || null })}
                    />
                  </div>
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

            <div className="mt-4 space-y-2">
              <Label>{t("bulletsLabel")}</Label>
              {entry.bullets.map((bullet, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={bullet}
                    onChange={(e) => updateBullet(entry.id, index, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeBullet(entry.id, index)}
                    aria-label={t("removeBulletLabel")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => addBullet(entry.id)}>
                <Plus className="size-4" />
                {t("addBulletButton")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
