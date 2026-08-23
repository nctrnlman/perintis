"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, FileCheck2, FileEdit, LayoutGrid, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FEATURES = [
  {
    href: "/features/ats-check",
    icon: FileCheck2,
    labelKey: "atsCheck",
    descriptionKey: "atsCheckDescription",
  },
  {
    href: "/features/resume-builder",
    icon: FileEdit,
    labelKey: "resumeBuilder",
    descriptionKey: "resumeBuilderDescription",
  },
  {
    href: "/features/cover-letter",
    icon: Mail,
    labelKey: "coverLetter",
    descriptionKey: "coverLetterDescription",
  },
] as const;

export function FeaturesDropdown() {
  const t = useTranslations("nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground">
        {t("features")}
        <ChevronDown className="size-3.5 transition-transform duration-200 group-data-popup-open:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-72">
        {FEATURES.map(({ href, icon: Icon, labelKey, descriptionKey }) => (
          <DropdownMenuItem
            key={href}
            render={<Link href={href} />}
            className="items-start gap-3 py-2.5"
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">{t(labelKey)}</span>
              <span className="text-xs text-muted-foreground">{t(descriptionKey)}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/features" />} className="gap-3 py-2">
          <LayoutGrid className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium text-foreground">{t("seeAllFeatures")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
