"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectEntry } from "@/lib/resume-builder/types";
import { RichTextarea } from "@/components/resume-builder/rich-textarea";

interface ProjectsSectionProps {
  entries: ProjectEntry[];
  onChange: (entries: ProjectEntry[]) => void;
}

function emptyEntry(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: "",
    client: "",
    role: "",
    bullets: [],
    techStack: [],
  };
}

export function ProjectsSection({ entries, onChange }: ProjectsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<ProjectEntry>) {
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
    updateEntry(entryId, { bullets: entry.bullets.map((b, i) => (i === index ? value : b)) });
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

  function updateTechStack(entryId: string, value: string) {
    updateEntry(entryId, {
      techStack: value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("projectsTitle")}</h2>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <p className="text-sm font-medium">{entry.name || t("newEntryLabel")}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeEntry(entry.id)}
                aria-label={t("removeEntryLabel")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`pr-name-${entry.id}`}>{t("nameLabel")}</Label>
                <Input
                  id={`pr-name-${entry.id}`}
                  value={entry.name}
                  onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pr-client-${entry.id}`}>{t("clientLabel")}</Label>
                <Input
                  id={`pr-client-${entry.id}`}
                  value={entry.client}
                  onChange={(e) => updateEntry(entry.id, { client: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pr-role-${entry.id}`}>{t("roleLabel")}</Label>
                <Input
                  id={`pr-role-${entry.id}`}
                  value={entry.role}
                  onChange={(e) => updateEntry(entry.id, { role: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`pr-tech-${entry.id}`}>{t("techStackLabel")}</Label>
                <Input
                  id={`pr-tech-${entry.id}`}
                  value={entry.techStack.join(", ")}
                  onChange={(e) => updateTechStack(entry.id, e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Label>{t("bulletsLabel")}</Label>
              {entry.bullets.map((bullet, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <RichTextarea
                      value={bullet}
                      onChange={(value) => updateBullet(entry.id, index, value)}
                      rows={2}
                      boldLabel={t("boldLabel")}
                    />
                  </div>
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
