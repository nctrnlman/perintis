import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
}

interface DataTableFilterPillsProps {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  paramKey: string;
  options: FilterOption[];
  allLabel: string;
}

export function DataTableFilterPills({
  basePath,
  searchParams,
  paramKey,
  options,
  allLabel,
}: DataTableFilterPillsProps) {
  const current = searchParams[paramKey];

  function hrefFor(value: string | undefined): string {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val && key !== paramKey && key !== "page") params.set(key, val);
    }
    if (value) params.set(paramKey, value);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function pillClass(active: boolean): string {
    return cn(
      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
      active
        ? "border-foreground bg-foreground text-background"
        : "border-border text-muted-foreground hover:bg-muted"
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={hrefFor(undefined)} className={pillClass(!current)}>
        {allLabel}
      </Link>
      {options.map((option) => (
        <Link key={option.value} href={hrefFor(option.value)} className={pillClass(current === option.value)}>
          {option.label}
        </Link>
      ))}
    </div>
  );
}
