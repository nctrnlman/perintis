import { describe, expect, it } from "vitest";
import { computeCareerFitAggregateStats } from "./stats";

describe("computeCareerFitAggregateStats", () => {
  it("returns zeros and null topRole for no analyses", () => {
    expect(computeCareerFitAggregateStats([])).toEqual({
      totalAnalyses: 0,
      totalStrongMatches: 0,
      topRole: null,
    });
  });

  it("counts analyses and strong matches within a single analysis", () => {
    const result = computeCareerFitAggregateStats([
      [
        { title: "Product Designer", tier: "STRONG" },
        { title: "UI/UX Designer", tier: "GOOD" },
        { title: "Backend Engineer", tier: "WORTH_EXPLORING" },
      ],
    ]);
    expect(result.totalAnalyses).toBe(1);
    expect(result.totalStrongMatches).toBe(1);
    expect(result.topRole).toEqual({ title: "Product Designer", count: 1 });
  });

  it("accumulates strong matches across multiple analyses", () => {
    const result = computeCareerFitAggregateStats([
      [{ title: "Product Designer", tier: "STRONG" }, { title: "UI/UX Designer", tier: "GOOD" }],
      [{ title: "Product Designer", tier: "STRONG" }, { title: "Backend Engineer", tier: "STRONG" }],
    ]);
    expect(result.totalAnalyses).toBe(2);
    expect(result.totalStrongMatches).toBe(3);
    expect(result.topRole).toEqual({ title: "Product Designer", count: 2 });
  });

  it("returns null topRole when there are no strong matches", () => {
    const result = computeCareerFitAggregateStats([
      [{ title: "Product Designer", tier: "GOOD" }, { title: "Backend Engineer", tier: "WORTH_EXPLORING" }],
    ]);
    expect(result.totalStrongMatches).toBe(0);
    expect(result.topRole).toBeNull();
  });

  it("keeps the first-seen title when strong-match counts are tied", () => {
    const result = computeCareerFitAggregateStats([
      [{ title: "Product Designer", tier: "STRONG" }],
      [{ title: "Backend Engineer", tier: "STRONG" }],
    ]);
    expect(result.topRole).toEqual({ title: "Product Designer", count: 1 });
  });
});
