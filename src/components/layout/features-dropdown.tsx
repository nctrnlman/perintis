"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, FileCheck2, FileEdit, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FEATURES = [
  { href: "/features/ats-check", icon: FileCheck2, labelKey: "atsCheck" },
  { href: "/features/resume-builder", icon: FileEdit, labelKey: "resumeBuilder" },
  { href: "/features/cover-letter", icon: Mail, labelKey: "coverLetter" },
] as const;

export function FeaturesDropdown() {
  const t = useTranslations("nav");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground outline-none hover:text-foreground">
        {t("features")}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {FEATURES.map(({ href, icon: Icon, labelKey }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            <Icon className="size-4" />
            {t(labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
