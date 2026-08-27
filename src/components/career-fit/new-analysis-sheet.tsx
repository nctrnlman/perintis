"use client";

import { useTransition } from "react";
import { Compass, MessageSquare, Sparkles, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetBody, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import { createPotentialAnalysis } from "@/app/[locale]/(app)/career-fit/actions";

const STEP_ICONS = [UserRound, Sparkles, MessageSquare];

interface NewAnalysisSheetProps {
  closeMode?: "back" | "replace";
}

export function NewAnalysisSheet({ closeMode = "back" }: NewAnalysisSheetProps) {
  const t = useTranslations("careerFit.new");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const steps = t.raw("steps") as string[];

  function handleGenerate() {
    startTransition(async () => {
      const result = await createPotentialAnalysis();
      if ("error" in result) {
        if (result.error === "no-skills") {
          toast.add({ title: t("toastNoSkills"), type: "error" });
        } else {
          toast.add({ title: t("toastGenerateError"), type: "error" });
        }
        trackEvent("career_fit_generate_failed", { error: result.error });
        return;
      }
      trackEvent("career_fit_generated");
      router.push(`/career-fit/${result.token}`);
    });
  }

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
        <SheetBody className="flex flex-col items-center pt-14 pb-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Compass className="size-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">{t("title")}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("description")}</p>

          <div className="mt-6 w-full space-y-3 text-left">
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[index];
              return (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <p className="text-sm">{step}</p>
                </div>
              );
            })}
          </div>

          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={isPending}
            onClick={handleGenerate}
          >
            {isPending ? t("generating") : t("submit")}
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
