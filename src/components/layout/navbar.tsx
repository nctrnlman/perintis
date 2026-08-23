import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { FeaturesDropdown } from "@/components/layout/features-dropdown";

export async function Navbar() {
  const t = await getTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <FeaturesDropdown />
          <Link href="/contact" className="hover:text-foreground">
            {t("contact")}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href="/login">{t("login")}</Link>}
          />
          <Button
            nativeButton={false}
            render={<Link href="/register">{t("register")}</Link>}
          />
        </div>
      </div>
    </header>
  );
}
