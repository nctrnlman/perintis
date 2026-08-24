export interface StageColor {
  dot: string;
  text: string;
}

export const STAGE_COLORS: Record<string, StageColor> = {
  WISHLIST: { dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
  APPLIED: { dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  INTERVIEWING: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  OFFER: { dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
  ACCEPTED: { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  REJECTED: { dot: "bg-red-500", text: "text-red-500" },
  WITHDRAWN: { dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
};

export function getStageColor(stage: string): StageColor {
  return STAGE_COLORS[stage] ?? STAGE_COLORS.WISHLIST;
}
