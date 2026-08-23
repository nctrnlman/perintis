"use client";

import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics-events";

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].slice(0, 2).toUpperCase();
    }
  }
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({
  userEmail,
  userName,
}: {
  userEmail: string;
  userName: string | null;
}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    trackEvent("logout");
    toast.add({ title: t("toastLoggedOut"), type: "info" });
    router.push("/login");
    router.refresh();
  }

  const initials = getInitials(userName, userEmail);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={userName ?? userEmail}
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="min-w-56">
        <div className="px-2 py-1.5">
          {userName && <p className="text-sm font-medium text-foreground">{userName}</p>}
          <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/profile" />}>
          <User />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
