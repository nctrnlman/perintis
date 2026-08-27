"use client";

import { useTransition } from "react";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { deleteAtsCheckAnalysis } from "@/app/[locale]/(app)/ats-check/actions";
import { trackEvent } from "@/lib/analytics-events";

export function AtsCheckRowActions({ id, token }: { id: string; token: string }) {
  const t = useTranslations("ats.list");
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
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        aria-label={t("tableActions")}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/ats-check/${token}`} />}>
          <Eye className="size-4" />
          {t("viewDetail")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2 className="size-4" />
          {t("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
