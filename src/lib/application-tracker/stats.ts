export type ApplicationStageLike =
  | "WISHLIST"
  | "APPLIED"
  | "INTERVIEWING"
  | "OFFER"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApplicationStats {
  total: number;
  activePipeline: number;
  winRate: number | null;
  interviewConversion: number | null;
}

const TERMINAL_STAGES = new Set<ApplicationStageLike>(["ACCEPTED", "REJECTED", "WITHDRAWN"]);
const INTERVIEWED_OR_LATER = new Set<ApplicationStageLike>([
  "INTERVIEWING",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
]);

export function computeApplicationStats(stages: ApplicationStageLike[]): ApplicationStats {
  const total = stages.length;
  const activePipeline = stages.filter((stage) => !TERMINAL_STAGES.has(stage)).length;

  const accepted = stages.filter((stage) => stage === "ACCEPTED").length;
  const rejected = stages.filter((stage) => stage === "REJECTED").length;
  const decided = accepted + rejected;
  const winRate = decided === 0 ? null : Math.round((accepted / decided) * 100);

  const applied = stages.filter((stage) => stage !== "WISHLIST").length;
  const interviewed = stages.filter((stage) => INTERVIEWED_OR_LATER.has(stage)).length;
  const interviewConversion = applied === 0 ? null : Math.round((interviewed / applied) * 100);

  return { total, activePipeline, winRate, interviewConversion };
}
