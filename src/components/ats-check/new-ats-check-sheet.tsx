"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import { NewAtsCheckForm } from "@/components/ats-check/new-ats-check-form";

interface NewAtsCheckSheetProps {
  closeMode?: "back" | "replace";
}

export function NewAtsCheckSheet({ closeMode = "back" }: NewAtsCheckSheetProps) {
  const t = useTranslations("ats.upload");
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
      <SheetContent className="sm:max-w-xl">
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetBody className="pt-14 pb-6">
          <NewAtsCheckForm closeMode={closeMode} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
