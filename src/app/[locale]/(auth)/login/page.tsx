"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { Reveal } from "@/components/shared/reveal";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { trackEvent } from "@/lib/analytics-events";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const tPassword = useTranslations("auth.password");
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      trackEvent("login_failed");
      toast.add({
        title: t("toastErrorTitle"),
        description: error.message,
        type: "error",
      });
      return;
    }

    trackEvent("login", { method: "email" });
    toast.add({ title: t("toastSuccessTitle"), type: "success" });
    router.push("/dashboard");
  }

  return (
    <Reveal className="rounded-2xl border border-border bg-card p-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            autoFocus
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            showLabel={tPassword("show")}
            hideLabel={tPassword("hide")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {t("googleNote")}
      </p>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </Reveal>
  );
}
