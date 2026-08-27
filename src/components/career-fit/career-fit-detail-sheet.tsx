"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import { DeletePotentialAnalysisButton } from "@/components/career-fit/delete-potential-analysis-button";
import { CareerFitResultCard, type CareerFitResult } from "@/components/career-fit/career-fit-result-card";

export interface CareerFitDetailSheetProps {
  id: string;
  createdAt: Date;
  results: CareerFitResult[];
  closeMode?: "back" | "replace";
}

export function CareerFitDetailSheet({
  id,
  createdAt,
  results,
  closeMode = "back",
}: CareerFitDetailSheetProps) {
  const t = useTranslations("careerFit.detail");
  const tList = useTranslations("careerFit.list");
  const format = useFormatter();
  const router = useRouter();

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (open) return;
        if (closeMode === "replace") {
          router.replace("/career-fit");
        } else {
          router.back();
        }
      }}
    >
      <SheetContent>
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetBody className="pt-14 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{t("title")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tList("resultCount", { count: results.length })} &middot;{" "}
                {format.dateTime(createdAt, { dateStyle: "medium" })}
              </p>
            </div>
            <DeletePotentialAnalysisButton id={id} />
          </div>

          <div className="mt-5 space-y-3">
            {results.map((result) => (
              <CareerFitResultCard key={result.roleId} result={result} />
            ))}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
