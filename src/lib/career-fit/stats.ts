import type { RoleMatch } from "./match-roles";

type ResultLike = Pick<RoleMatch, "title" | "tier">;

export interface CareerFitAggregateStats {
  totalAnalyses: number;
  totalStrongMatches: number;
  topRole: { title: string; count: number } | null;
}

export function computeCareerFitAggregateStats(
  analyses: ResultLike[][]
): CareerFitAggregateStats {
  const totalAnalyses = analyses.length;
  const strongResults = analyses.flat().filter((result) => result.tier === "STRONG");
  const totalStrongMatches = strongResults.length;

  const counts = new Map<string, number>();
  for (const result of strongResults) {
    counts.set(result.title, (counts.get(result.title) ?? 0) + 1);
  }

  let topRole: { title: string; count: number } | null = null;
  for (const [title, count] of counts) {
    if (!topRole || count > topRole.count) {
      topRole = { title, count };
    }
  }

  return { totalAnalyses, totalStrongMatches, topRole };
}
