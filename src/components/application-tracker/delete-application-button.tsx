"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteApplication } from "@/app/[locale]/(app)/application-tracker/actions";
import { trackEvent } from "@/lib/analytics-events";

export function DeleteApplicationButton({ id }: { id: string }) {
  const t = useTranslations("applicationTracker.editor");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteApplication(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      trackEvent("application_deleted");
      router.push("/application-tracker");
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="size-4" />
      {t("deleteButton")}
    </Button>
  );
}
