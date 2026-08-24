"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { toast } from "@/components/ui/toast";
import { trackEvent } from "@/lib/analytics-events";
import { createPotentialAnalysis } from "../actions";

export default function NewCareerFitPage() {
  const t = useTranslations("careerFit.new");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    <Reveal className="mx-auto max-w-xl text-center">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("description")}</p>
      <Button size="lg" className="mt-8" disabled={isPending} onClick={handleGenerate}>
        {isPending ? t("generating") : t("submit")}
      </Button>
    </Reveal>
  );
}
