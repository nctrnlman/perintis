"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { toast } from "@/components/ui/toast";
import { createResumeDocument } from "@/app/[locale]/(app)/resume-builder/actions";

export function CreateResumeButton() {
  const t = useTranslations("resumeBuilder.list");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createResumeDocument();
      if ("error" in result) {
        toast.add({ title: t("toastCreateError"), type: "error" });
        return;
      }
      router.push(`/resume-builder/${result.token}`);
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      <Plus className="size-4" />
      {t("newButton")}
    </Button>
  );
}
