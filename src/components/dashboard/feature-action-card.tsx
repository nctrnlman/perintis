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
      className="group flex h-full flex-col rounded-2xl border border-border p-6 transition-transform hover:scale-[1.02]"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
        <Icon className="size-5 text-primary" />
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{hint}</p>
      <ArrowRight className="mt-4 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
