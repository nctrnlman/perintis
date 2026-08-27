"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";

interface AtsCheckDetailSheetProps {
  closeMode?: "back" | "replace";
  children: React.ReactNode;
}

export function AtsCheckDetailSheet({ closeMode = "back", children }: AtsCheckDetailSheetProps) {
  const t = useTranslations("ats.result");
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open) return;
        if (closeMode === "replace") {
          router.replace("/ats-check");
        } else {
          router.back();
        }
      }}
    >
      <SheetContent className="sm:max-w-2xl">
        <SheetTitle className="sr-only">{t("scoreLabel")}</SheetTitle>
        <SheetBody className="pt-14 pb-6">{children}</SheetBody>
      </SheetContent>
    </Sheet>
  );
}
