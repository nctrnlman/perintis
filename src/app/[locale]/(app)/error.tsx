"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("appError");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
        !
      </span>
      <h1 className="mt-4 text-xl font-semibold">{t("title")}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("description")}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => retry()}>{t("retry")}</Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard">{t("cta")}</Link>}
        />
      </div>
    </div>
  );
}
