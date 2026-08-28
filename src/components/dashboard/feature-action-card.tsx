import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface FeatureActionCardProps {
  icon: LucideIcon;
  href: string;
  title: string;
  hint: string;
}

export function FeatureActionCard({ icon: Icon, href, title, hint }: FeatureActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex h-full items-center gap-3.5 rounded-2xl border border-border p-5 transition-colors hover:bg-muted/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{hint}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
