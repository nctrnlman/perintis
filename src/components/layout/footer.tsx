import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { DEVELOPER_LINKS } from "@/lib/developer-links";

const FOOTER_COLUMNS = [
  {
    titleKey: "productHeading",
    links: [
      { href: "/features", labelKey: "allFeatures" },
      { href: "/features/ats-check", labelKey: "atsCheck" },
      { href: "/features/resume-builder", labelKey: "resumeBuilder" },
      { href: "/features/cover-letter", labelKey: "coverLetter" },
      { href: "/features/application-tracker", labelKey: "applicationTracker" },
      { href: "/features/career-fit", labelKey: "careerFit" },
      { href: "/pricing", labelKey: "pricing" },
    ],
  },
  {
    titleKey: "companyHeading",
    links: [
      { href: "/about", labelKey: "about" },
      { href: "/blog", labelKey: "blog" },
      { href: "/contact", labelKey: "contact" },
    ],
  },
  {
    titleKey: "legalHeading",
    links: [
      { href: "/privacy-policy", labelKey: "privacyPolicy" },
      { href: "/terms-of-service", labelKey: "termsOfService" },
    ],
  },
] as const;

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-border/40 py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-semibold">Perintis</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("madeBy")}</p>
            <div className="mt-4 flex items-center gap-1">
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

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.titleKey}>
              <p className="text-sm font-medium text-foreground">{t(column.titleKey)}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-border/40 pt-8 text-sm text-muted-foreground">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
