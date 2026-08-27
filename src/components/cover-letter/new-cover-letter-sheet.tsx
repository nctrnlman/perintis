"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import { NewCoverLetterForm } from "@/components/cover-letter/new-cover-letter-form";

interface NewCoverLetterSheetProps {
  closeMode?: "back" | "replace";
}

export function NewCoverLetterSheet({ closeMode = "back" }: NewCoverLetterSheetProps) {
  const t = useTranslations("coverLetter.new");
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open) return;
        if (closeMode === "replace") {
          router.replace("/cover-letter");
        } else {
          router.back();
        }
      }}
    >
      <SheetContent className="sm:max-w-2xl">
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetBody className="pt-14 pb-6">
          <NewCoverLetterForm closeMode={closeMode} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
