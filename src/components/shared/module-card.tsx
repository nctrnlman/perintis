import type { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
  comingSoonLabel: string;
}

export function ModuleCard({
  icon: Icon,
  title,
  description,
  comingSoon = true,
  comingSoonLabel,
}: ModuleCardProps) {
  return (
    <div className="relative h-full rounded-2xl border border-border p-6">
      {comingSoon && (
        <span className="absolute right-4 top-4 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {comingSoonLabel}
        </span>
      )}
      <div className="flex size-11 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
