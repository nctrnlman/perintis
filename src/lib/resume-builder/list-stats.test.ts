import { describe, expect, it } from "vitest";
import { computeResumeListStats } from "./list-stats";

const NOW = new Date("2026-08-26T12:00:00.000Z");

describe("computeResumeListStats", () => {
  it("returns all zeros for no documents", () => {
    expect(computeResumeListStats([], NOW)).toEqual({ total: 0, addedThisWeek: 0 });
  });

  it("counts the total number of documents", () => {
    const result = computeResumeListStats([{ createdAt: NOW }, { createdAt: NOW }], NOW);
    expect(result.total).toBe(2);
  });

  it("counts documents created within the last 7 days", () => {
    const withinWeek = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    const overAWeekAgo = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    const result = computeResumeListStats(
      [{ createdAt: withinWeek }, { createdAt: overAWeekAgo }],
      NOW
    );
    expect(result.addedThisWeek).toBe(1);
  });
});
