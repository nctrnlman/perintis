"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, MailCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/shared/reveal";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Reveal className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted">
          <MailCheck className="size-5 text-foreground" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">{t("sentTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("sentDescription")}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          {t("backToLogin")}
        </Link>
      </Reveal>
    );
  }

  return (
    <Reveal className="rounded-2xl border border-border bg-card p-8">
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <KeyRound className="size-5 text-foreground" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </Reveal>
  );
}
