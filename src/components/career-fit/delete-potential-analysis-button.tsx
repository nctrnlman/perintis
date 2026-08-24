"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deletePotentialAnalysis } from "@/app/[locale]/(app)/career-fit/actions";
import { trackEvent } from "@/lib/analytics-events";

export function DeletePotentialAnalysisButton({ id }: { id: string }) {
  const t = useTranslations("careerFit");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePotentialAnalysis(id);
      if ("error" in result) {
        toast.add({ title: t("list.toastDeleteError"), type: "error" });
        return;
      }
      trackEvent("career_fit_deleted");
      router.push("/career-fit");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={t("list.delete")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
