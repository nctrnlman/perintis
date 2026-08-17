"use client";

import { useRef, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  addCertification,
  deleteCertification,
} from "@/app/[locale]/(app)/profile/actions";

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

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

export function CertificationsCard({ certifications }: CertificationsCardProps) {
  const t = useTranslations("profile.certifications");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addCertification(formData);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastAddSuccess"), type: "success" });
      formRef.current?.reset();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCertification(id);
      if ("error" in result) {
        toast.add({ title: t("toastError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <div className="rounded-2xl border border-border p-8">
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {certifications.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-border p-6"
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
                    {formatMonthYear(cert.issueDate)}
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

      <form
        ref={formRef}
        action={handleSubmit}
        className="mt-6 space-y-4 rounded-2xl border border-border p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cert-name">{t("nameLabel")}</Label>
            <Input id="cert-name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-issuer">{t("issuerLabel")}</Label>
            <Input id="cert-issuer" name="issuer" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-issueDate">{t("issueDateLabel")}</Label>
            <Input id="cert-issueDate" name="issueDate" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cert-url">{t("urlLabel")}</Label>
            <Input id="cert-url" name="url" />
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
