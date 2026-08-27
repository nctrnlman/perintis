import { CheckCircle2, XCircle } from "lucide-react";
import { ScoreRing } from "@/components/shared/score-ring";

interface AtsPreviewCardProps {
  tierLabel: string;
  summaryLabel: string;
  matchedLabel: string;
  missingLabel: string;
}

export function AtsPreviewCard({
  tierLabel,
  summaryLabel,
  matchedLabel,
  missingLabel,
}: AtsPreviewCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center gap-5">
        <ScoreRing score={92} size={84} />
        <div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {tierLabel}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">{summaryLabel}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            {matchedLabel}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
              React
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
              Node.js
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
              REST API
            </span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <XCircle className="size-3.5" />
            {missingLabel}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs text-red-600 dark:text-red-400">
              TypeScript
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
