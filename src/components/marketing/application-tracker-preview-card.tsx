import { getStageColor } from "@/lib/application-tracker/stage-colors";

interface ApplicationTrackerPreviewCardProps {
  appliedLabel: string;
  interviewingLabel: string;
  acceptedLabel: string;
}

const COLUMNS = [
  { stage: "APPLIED", labelKey: "appliedLabel" as const, items: ["Acme Corp", "Globex Inc"] },
  { stage: "INTERVIEWING", labelKey: "interviewingLabel" as const, items: ["Initech"] },
  { stage: "ACCEPTED", labelKey: "acceptedLabel" as const, items: ["Umbrella Co"] },
];

export function ApplicationTrackerPreviewCard(props: ApplicationTrackerPreviewCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="grid grid-cols-3 gap-3">
        {COLUMNS.map((column) => {
          const color = getStageColor(column.stage);
          return (
            <div key={column.stage} className="rounded-2xl bg-background p-3 ring-1 ring-border">
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
                <p className="truncate text-xs font-medium">{props[column.labelKey]}</p>
              </div>
              <div className="mt-3 space-y-1.5">
                {column.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
