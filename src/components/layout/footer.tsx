import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
        <div className="flex gap-6">
          <Link href="/privacy-policy" className="hover:text-foreground">
            {t("privacyPolicy")}
          </Link>
          <Link href="/terms-of-service" className="hover:text-foreground">
            {t("termsOfService")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
