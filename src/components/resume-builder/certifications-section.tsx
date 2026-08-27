"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CertificationEntry } from "@/lib/resume-builder/types";

interface CertificationsSectionProps {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

function emptyEntry(): CertificationEntry {
  return { id: crypto.randomUUID(), name: "", issuer: "", issueDate: null, url: "" };
}

export function CertificationsSection({ entries, onChange }: CertificationsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function updateEntry(id: string, patch: Partial<CertificationEntry>) {
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
        <h2 className="text-xl font-semibold">{t("certificationsTitle")}</h2>
        <Button variant="outline" size="sm" onClick={addEntry}>
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border p-4">
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
                <Label htmlFor={`cert-name-${entry.id}`}>{t("nameLabel")}</Label>
                <Input
                  id={`cert-name-${entry.id}`}
                  value={entry.name}
                  onChange={(e) => updateEntry(entry.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cert-issuer-${entry.id}`}>{t("issuerLabel")}</Label>
                <Input
                  id={`cert-issuer-${entry.id}`}
                  value={entry.issuer}
                  onChange={(e) => updateEntry(entry.id, { issuer: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cert-issueDate-${entry.id}`}>{t("issueDateLabel")}</Label>
                <Input
                  id={`cert-issueDate-${entry.id}`}
                  type="date"
                  value={entry.issueDate ?? ""}
                  onChange={(e) => updateEntry(entry.id, { issueDate: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`cert-url-${entry.id}`}>{t("urlLabel")}</Label>
                <Input
                  id={`cert-url-${entry.id}`}
                  type="url"
                  value={entry.url}
                  onChange={(e) => updateEntry(entry.id, { url: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
