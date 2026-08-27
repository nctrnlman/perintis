import { Compass, FileCheck2, FileEdit, ListChecks, Mail, SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const QUICK_LINKS = [
  { href: "/features/ats-check", icon: FileCheck2, labelKey: "atsCheck" },
  { href: "/features/resume-builder", icon: FileEdit, labelKey: "resumeBuilder" },
  { href: "/features/cover-letter", icon: Mail, labelKey: "coverLetter" },
  { href: "/features/application-tracker", icon: ListChecks, labelKey: "applicationTracker" },
  { href: "/features/career-fit", icon: Compass, labelKey: "careerFit" },
] as const;

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tNav = await getTranslations("nav");

  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-24 text-center">
        <Reveal>
          <span className="relative flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <SearchX className="size-7 animate-pulse" />
          </span>
        </Reveal>
        <Reveal delay={60}>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("description")}</p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button nativeButton={false} render={<Link href="/">{t("cta")}</Link>} />
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/features">{t("secondaryCta")}</Link>}
            />
          </div>
        </Reveal>
        <Reveal delay={180}>
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-xs font-medium text-muted-foreground">{t("quickLinksLabel")}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {QUICK_LINKS.map(({ href, icon: Icon, labelKey }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm transition-colors hover:bg-muted"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  {tNav(labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
