import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/shared/reveal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const principles = t.raw("principles") as string[];

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("intro")}</p>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 space-y-8">
          <div>
            <h2 className="text-lg font-semibold">{t("missionHeading")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("missionBody")}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t("principlesHeading")}</h2>
            <ul className="mt-3 space-y-3">
              {principles.map((principle) => (
                <li key={principle} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground" />
                  {principle}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">{t("whoHeading")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t.rich("whoBody", {
                contact: (chunks) => (
                  <Link href="/contact" className="font-medium text-primary hover:underline">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
