"use client";

import { useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { RequiredMark } from "@/components/shared/property-row";
import {
  addCertification,
  deleteCertification,
} from "@/app/[locale]/(app)/profile/actions";
import { trackEvent } from "@/lib/analytics-events";

interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date | null;
  url: string | null;
}

interface CertificationsCardProps {
  certifications: CertificationItem[];
}

export function CertificationsCard({ certifications }: CertificationsCardProps) {
  const t = useTranslations("profile.certifications");
  const format = useFormatter();
  const [isPending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);

  function closeForm() {
    setFormOpen(false);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addCertification(formData);
      if ("error" in result) {
        trackEvent("profile_section_update_failed", { section: "certification", action: "add" });
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      trackEvent("profile_section_updated", { section: "certification", action: "add" });
      toast.add({ title: t("toastAddSuccess"), type: "success" });
      closeForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCertification(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      trackEvent("profile_section_updated", { section: "certification", action: "delete" });
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        {!formOpen && (
          <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            {t("addButton")}
          </Button>
        )}
      </div>

      {certifications.length === 0 && !formOpen && (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {certifications.length > 0 && (
        <div className="mt-6 space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-border p-4"
            >
              <div>
                <h3 className="font-medium">
                  {cert.url ? (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      {cert.name}
                    </a>
                  ) : (
                    cert.name
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                {cert.issueDate && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format.dateTime(cert.issueDate, { month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(cert.id)}
                aria-label={t("toastDeleteSuccess")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <form
          action={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-border p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cert-name">
                {t("nameLabel")} <RequiredMark />
              </Label>
              <Input id="cert-name" name="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cert-issuer">
                {t("issuerLabel")} <RequiredMark />
              </Label>
              <Input id="cert-issuer" name="issuer" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cert-issueDate">{t("issueDateLabel")}</Label>
              <Input id="cert-issueDate" name="issueDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cert-url">{t("urlLabel")}</Label>
              <Input id="cert-url" name="url" type="url" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
