"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { deleteCoverLetter } from "@/app/[locale]/(app)/cover-letter/actions";

export function DeleteCoverLetterButton({ id }: { id: string }) {
  const t = useTranslations("coverLetter.list");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCoverLetter(id);
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
