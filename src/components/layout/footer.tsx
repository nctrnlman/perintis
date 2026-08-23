import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DEVELOPER_LINKS } from "@/lib/developer-links";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-4 border-b border-border/40 pb-8 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">{t("madeBy")}</p>
          <div className="flex items-center gap-1">
            {DEVELOPER_LINKS.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                aria-label={label}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/features/ats-check" className="hover:text-foreground">
              {t("atsCheck")}
            </Link>
            <Link href="/features/resume-builder" className="hover:text-foreground">
              {t("resumeBuilder")}
            </Link>
            <Link href="/features/cover-letter" className="hover:text-foreground">
              {t("coverLetter")}
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              {t("contact")}
            </Link>
            <Link href="/privacy-policy" className="hover:text-foreground">
              {t("privacyPolicy")}
            </Link>
            <Link href="/terms-of-service" className="hover:text-foreground">
              {t("termsOfService")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
