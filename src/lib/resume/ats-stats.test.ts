import { describe, expect, it } from "vitest";
import { computeAtsCheckStats } from "./ats-stats";

const NOW = new Date("2026-08-26T12:00:00.000Z");

describe("computeAtsCheckStats", () => {
  it("returns all zeros for no checks", () => {
    expect(computeAtsCheckStats([], NOW)).toEqual({
      total: 0,
      excellentCount: 0,
      goodCount: 0,
      needsWorkCount: 0,
      addedThisWeek: 0,
    });
  });

  it("counts total and breaks down by score tier", () => {
    const result = computeAtsCheckStats(
      [
        { overallScore: 95, createdAt: NOW },
        { overallScore: 80, createdAt: NOW },
        { overallScore: 50, createdAt: NOW },
        { overallScore: 92, createdAt: NOW },
      ],
      NOW
    );
    expect(result.total).toBe(4);
    expect(result.excellentCount).toBe(2);
    expect(result.goodCount).toBe(1);
    expect(result.needsWorkCount).toBe(1);
  });

  it("counts checks created within the last 7 days", () => {
    const withinWeek = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    const overAWeekAgo = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    const result = computeAtsCheckStats(
      [
        { overallScore: 90, createdAt: withinWeek },
        { overallScore: 90, createdAt: overAWeekAgo },
      ],
      NOW
    );
    expect(result.addedThisWeek).toBe(1);
  });
});
