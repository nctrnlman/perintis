import type { LucideIcon } from "lucide-react";

interface ComingSoonItem {
  icon: LucideIcon;
  title: string;
}

interface ComingSoonStripProps {
  title: string;
  badgeLabel: string;
  items: ComingSoonItem[];
}

export function ComingSoonStrip({ title, badgeLabel, items }: ComingSoonStripProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 flex flex-col divide-y divide-border rounded-2xl border border-border sm:flex-row sm:divide-x sm:divide-y-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex flex-1 items-center gap-3 p-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <p className="flex-1 text-sm font-medium">{item.title}</p>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {badgeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
