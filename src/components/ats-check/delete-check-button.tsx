"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteAtsCheckAnalysis } from "@/app/[locale]/(app)/ats-check/actions";
import { trackEvent } from "@/lib/analytics-events";

export function DeleteCheckButton({ id }: { id: string }) {
  const t = useTranslations("ats.list");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAtsCheckAnalysis(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      trackEvent("ats_check_deleted");
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
      router.push("/ats-check");
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
      <Trash2 className="size-4" />
      {t("delete")}
    </Button>
  );
}
