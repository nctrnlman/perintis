"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import {
  CoverLetterDetailFields,
  type CoverLetterDetailFieldsProps,
} from "@/components/cover-letter/cover-letter-detail-fields";

interface CoverLetterDetailSheetProps extends Omit<CoverLetterDetailFieldsProps, "onDeleted"> {
  closeMode?: "back" | "replace";
}

export function CoverLetterDetailSheet({
  closeMode = "back",
  ...fieldsProps
}: CoverLetterDetailSheetProps) {
  const t = useTranslations("coverLetter.editor");
  const router = useRouter();

  function goToList() {
    router.replace("/cover-letter");
  }

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
        <SheetTitle className="sr-only">{t("detailsTitle")}</SheetTitle>
        <SheetBody className="pt-14 pb-6">
          <CoverLetterDetailFields {...fieldsProps} onDeleted={goToList} />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
