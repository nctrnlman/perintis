"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/shared/password-input";
import { Reveal } from "@/components/shared/reveal";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/validations/auth";

export default function UpdatePasswordPage() {
  const t = useTranslations("auth.updatePassword");
  const tPassword = useTranslations("auth.password");
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onBlur",
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: UpdatePasswordInput) {
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      toast.add({
        title: t("toastErrorTitle"),
        description: error.message,
        type: "error",
      });
      return;
    }

    toast.add({ title: t("toastSuccessTitle"), type: "success" });
    router.push("/login");
  }

  return (
    <Reveal className="rounded-2xl border border-border bg-card p-10">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <PasswordInput
            id="password"
            autoFocus
            autoComplete="new-password"
            showLabel={tPassword("show")}
            hideLabel={tPassword("hide")}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : "password-hint"}
            {...register("password")}
          />
          {errors.password ? (
            <p id="password-error" className="text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : (
            <p id="password-hint" className="text-xs text-muted-foreground">
              {t("passwordHint")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            showLabel={tPassword("show")}
            hideLabel={tPassword("hide")}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Reveal>
  );
}
