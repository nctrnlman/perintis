interface ModuleCardProps {
  title: string;
  description: string;
  comingSoon?: boolean;
  comingSoonLabel: string;
}

export function ModuleCard({
  title,
  description,
  comingSoon = true,
  comingSoonLabel,
}: ModuleCardProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6">
      {comingSoon && (
        <span className="absolute right-4 top-4 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {comingSoonLabel}
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
