"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
      <Reveal>
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
            P
          </span>
          <span>
            <span className="block text-sm leading-tight font-semibold">Perintis</span>
            <span className="block text-xs leading-tight text-muted-foreground">
              by Rhazes Labs
            </span>
          </span>
        </Link>
      </Reveal>

      <Reveal delay={60}>
        <span className="mt-10 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => retry()}>{t("retry")}</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/">{t("cta")}</Link>} />
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground/70">
            {t("errorId")}: <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </Reveal>
    </main>
  );
}
