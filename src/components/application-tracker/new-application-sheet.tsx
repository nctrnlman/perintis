"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import {
  NewApplicationForm,
} from "@/app/[locale]/(app)/application-tracker/new/new-application-form";
import type { ComboboxOption } from "@/components/ui/combobox";

interface NewApplicationSheetProps {
  initialStage?: string;
  resumeOptions: ComboboxOption[];
  coverLetterOptions: ComboboxOption[];
  closeMode?: "back" | "replace";
}

export function NewApplicationSheet({
  initialStage,
  resumeOptions,
  coverLetterOptions,
  closeMode = "back",
}: NewApplicationSheetProps) {
  const t = useTranslations("applicationTracker.new");
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open) return;
        if (closeMode === "replace") {
          router.replace("/application-tracker");
        } else {
          router.back();
        }
      }}
    >
      <SheetContent>
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetBody className="pt-14 pb-6">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          <NewApplicationForm
            initialStage={initialStage}
            resumeOptions={resumeOptions}
            coverLetterOptions={coverLetterOptions}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
