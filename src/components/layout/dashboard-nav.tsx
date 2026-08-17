"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export function DashboardNav({ userEmail }: { userEmail: string }) {
  const t = useTranslations("nav");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.add({ title: t("toastLoggedOut"), type: "info" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Perintis
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground">
            {t("profile")}
          </Link>
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogout}>
            {t("logout")}
          </Button>
        </div>
      </div>
    </header>
  );
}
