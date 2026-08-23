import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/shared/reveal";
import { DEVELOPER_LINKS } from "@/lib/developer-links";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("description")}</p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 rounded-2xl border border-border p-8">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("developerLabel")}
          </p>
          <p className="mt-2 text-xl font-semibold">Rhazes Devino</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("about")}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {DEVELOPER_LINKS.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("mailto:") ? undefined : "_blank"}
                rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Icon className="size-4" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
