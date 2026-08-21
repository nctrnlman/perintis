"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import type { AutoSaveStatus } from "@/hooks/use-auto-save-form";

interface SaveStatusProps {
  status: AutoSaveStatus;
  namespace?: string;
}

export function SaveStatus({ status, namespace = "profile" }: SaveStatusProps) {
  const t = useTranslations(namespace);

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {t("autoSaving")}
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3.5" />
        {t("autoSaved")}
      </span>
    );
  }

  if (status === "error") {
    return <span className="text-xs text-destructive">{t("autoSaveError")}</span>;
  }

  return null;
}
