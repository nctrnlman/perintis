import { getScoreTier } from "./scoring";

export interface AtsCheckStatsInput {
  overallScore: number;
  createdAt: Date;
}

export interface AtsCheckAggregateStats {
  total: number;
  excellentCount: number;
  goodCount: number;
  needsWorkCount: number;
  addedThisWeek: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeAtsCheckStats(
  checks: AtsCheckStatsInput[],
  now: Date = new Date()
): AtsCheckAggregateStats {
  const total = checks.length;
  const tiers = checks.map((check) => getScoreTier(check.overallScore));

  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const addedThisWeek = checks.filter((check) => check.createdAt >= weekAgo).length;

  return {
    total,
    excellentCount: tiers.filter((tier) => tier === "excellent").length,
    goodCount: tiers.filter((tier) => tier === "good").length,
    needsWorkCount: tiers.filter((tier) => tier === "needsWork").length,
    addedThisWeek,
  };
}
