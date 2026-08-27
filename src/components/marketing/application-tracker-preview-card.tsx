import { AlertTriangle, Briefcase, MapPin } from "lucide-react";
import { getStageColor } from "@/lib/application-tracker/stage-colors";

interface ApplicationTrackerPreviewCardProps {
  appliedLabel: string;
  interviewingLabel: string;
  acceptedLabel: string;
  totalLabel: string;
  staleLabel: string;
}

const COLUMNS = [
  {
    stage: "APPLIED",
    labelKey: "appliedLabel" as const,
    items: [
      { company: "Acme Corp", location: "Jakarta" },
      { company: "Globex Inc", location: "Remote" },
    ],
  },
  {
    stage: "INTERVIEWING",
    labelKey: "interviewingLabel" as const,
    items: [{ company: "Initech", location: "Bandung" }],
  },
  {
    stage: "ACCEPTED",
    labelKey: "acceptedLabel" as const,
    items: [{ company: "Umbrella Co", location: "Remote" }],
  },
];

export function ApplicationTrackerPreviewCard(props: ApplicationTrackerPreviewCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 ring-1 ring-border">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Briefcase className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tabular-nums">12</span>
          <span className="text-xs text-muted-foreground">{props.totalLabel}</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 ring-1 ring-border">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">
            2
          </span>
          <span className="text-xs text-muted-foreground">{props.staleLabel}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {COLUMNS.map((column) => {
          const color = getStageColor(column.stage);
          return (
            <div key={column.stage} className="rounded-2xl bg-background p-2.5 ring-1 ring-border">
              <div className="flex items-center gap-1.5 px-0.5">
                <span className={`size-1.5 shrink-0 rounded-full ${color.dot}`} />
                <p className="truncate text-[0.7rem] font-medium">{props[column.labelKey]}</p>
              </div>
              <div className="mt-2 space-y-1.5">
                {column.items.map((item) => (
                  <div
                    key={item.company}
                    className="rounded-lg border border-border bg-card px-2 py-1.5"
                  >
                    <p className="truncate text-[11px] font-medium">{item.company}</p>
                    <p className="mt-0.5 flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                      <MapPin className="size-2.5 shrink-0" />
                      {item.location}
                    </p>
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
