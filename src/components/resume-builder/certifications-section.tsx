"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CertificationEntry } from "@/lib/resume-builder/types";

interface CertificationsSectionProps {
  entries: CertificationEntry[];
  onChange: (entries: CertificationEntry[]) => void;
}

export function CertificationsSection({ entries, onChange }: CertificationsSectionProps) {
  const t = useTranslations("resumeBuilder.builder");

  function addEntry(name: string, issuer: string, issueDate: string, url: string) {
    if (!name.trim() || !issuer.trim()) return;
    onChange([
      ...entries,
      { id: crypto.randomUUID(), name: name.trim(), issuer: issuer.trim(), issueDate: issueDate || null, url },
    ]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((entry) => entry.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("certificationsTitle")}</h2>

      <div className="mt-6 space-y-4">
        {entries.map((cert) => (
          <div
            key={cert.id}
            className="flex items-start justify-between gap-4 rounded-2xl border border-border p-6"
          >
            <div>
              <h3 className="font-medium">{cert.name}</h3>
              <p className="text-sm text-muted-foreground">{cert.issuer}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeEntry(cert.id)}
              aria-label={t("removeEntryLabel")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <form
        action={(formData) => {
          addEntry(
            String(formData.get("name") ?? ""),
            String(formData.get("issuer") ?? ""),
            String(formData.get("issueDate") ?? ""),
            String(formData.get("url") ?? "")
          );
        }}
        className="mt-6 grid gap-4 rounded-2xl border border-border p-6 sm:grid-cols-2"
      >
        <Input name="name" placeholder={t("nameLabel")} required />
        <Input name="issuer" placeholder={t("issuerLabel")} required />
        <Input name="issueDate" type="date" placeholder={t("issueDateLabel")} />
        <Input name="url" placeholder={t("urlLabel")} />
        <Button type="submit" variant="outline" size="sm" className="sm:col-span-2">
          <Plus className="size-4" />
          {t("addEntryButton")}
        </Button>
      </form>
    </div>
  );
}
