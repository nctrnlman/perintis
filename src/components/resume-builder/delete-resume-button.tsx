"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteResumeDocument } from "@/app/[locale]/(app)/resume-builder/actions";

export function DeleteResumeButton({ id }: { id: string }) {
  const t = useTranslations("resumeBuilder.list");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteResumeDocument(id);
      if ("error" in result) {
        toast.add({ title: t("toastDeleteError"), type: "error" });
        return;
      }
      toast.add({ title: t("toastDeleteSuccess"), type: "success" });
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleDelete}
      disabled={isPending}
      aria-label={t("delete")}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
