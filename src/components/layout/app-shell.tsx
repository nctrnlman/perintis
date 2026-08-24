"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  FileCheck2,
  FileEdit,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  MessagesSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { HeaderClock } from "@/components/layout/header-clock";

const moduleIcons = [FileCheck2, ShieldCheck, FileEdit, MessagesSquare, Mail, ListChecks];
const moduleRoutes: (string | null)[] = [
  null,
  "/ats-check",
  "/resume-builder",
  null,
  "/cover-letter",
  "/application-tracker",
];

interface AppShellProps {
  userEmail: string;
  userName: string | null;
  children: React.ReactNode;
}

export function AppShell({ userEmail, userName, children }: AppShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const modules = t.raw("dashboard.modules") as { title: string }[];
  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    ...modules.map((module, index) => ({
      href: moduleRoutes[index],
      icon: moduleIcons[index],
      label: module.title,
    })),
  ];

  const navBody = (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
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
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (!item.href) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground/50"
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs">{t("dashboard.comingSoon")}</span>
              </div>
            );
          }

          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-border bg-background">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
            {navBody}
          </aside>
        </div>
      )}

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border lg:flex">
        {navBody}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-background/95 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("nav.openMenu")}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <HeaderClock />
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <UserMenu userEmail={userEmail} userName={userName} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
