export type ApplicationStageLike =
  | "WISHLIST"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApplicationStatsInput {
  stage: ApplicationStageLike;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationStats {
  total: number;
  activePipeline: number;
  winRate: number | null;
  interviewConversion: number | null;
  addedThisWeek: number;
  staleCount: number;
  perStage: Record<ApplicationStageLike, number>;
}

const STAGE_ORDER: ApplicationStageLike[] = [
  "WISHLIST",
  "APPLIED",
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

const TERMINAL_STAGES = new Set<ApplicationStageLike>(["ACCEPTED", "REJECTED", "WITHDRAWN"]);
const INTERVIEWED_OR_LATER = new Set<ApplicationStageLike>([
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
]);

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_THRESHOLD_DAYS = 14;

export function computeApplicationStats(
  applications: ApplicationStatsInput[],
  now: Date = new Date()
): ApplicationStats {
  const stages = applications.map((application) => application.stage);
  const total = stages.length;
  const activePipeline = stages.filter((stage) => !TERMINAL_STAGES.has(stage)).length;

  const accepted = stages.filter((stage) => stage === "ACCEPTED").length;
  const rejected = stages.filter((stage) => stage === "REJECTED").length;
  const decided = accepted + rejected;
  const winRate = decided === 0 ? null : Math.round((accepted / decided) * 100);

  const applied = stages.filter((stage) => stage !== "WISHLIST").length;
  const interviewed = stages.filter((stage) => INTERVIEWED_OR_LATER.has(stage)).length;
  const interviewConversion = applied === 0 ? null : Math.round((interviewed / applied) * 100);

  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const addedThisWeek = applications.filter((application) => application.createdAt >= weekAgo).length;

  const staleThreshold = new Date(now.getTime() - STALE_THRESHOLD_DAYS * DAY_MS);
  const staleCount = applications.filter(
    (application) =>
      !TERMINAL_STAGES.has(application.stage) && application.updatedAt < staleThreshold
  ).length;

  const perStage = Object.fromEntries(
    STAGE_ORDER.map((stage) => [stage, stages.filter((s) => s === stage).length])
  ) as Record<ApplicationStageLike, number>;

  return {
    total,
    activePipeline,
    winRate,
    interviewConversion,
    addedThisWeek,
    staleCount,
    perStage,
  };
}
