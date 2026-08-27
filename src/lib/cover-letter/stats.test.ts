import { describe, expect, it } from "vitest";
import { computeCoverLetterStats } from "./stats";

const NOW = new Date("2026-08-26T12:00:00.000Z");

describe("computeCoverLetterStats", () => {
  it("returns all zeros for no letters", () => {
    expect(computeCoverLetterStats([], NOW)).toEqual({
      total: 0,
      formalCount: 0,
      casualCount: 0,
      addedThisWeek: 0,
    });
  });

  it("counts total and breaks down by tone", () => {
    const result = computeCoverLetterStats(
      [
        { tone: "formal", createdAt: NOW },
        { tone: "formal", createdAt: NOW },
        { tone: "casual", createdAt: NOW },
      ],
      NOW
    );
    expect(result.total).toBe(3);
    expect(result.formalCount).toBe(2);
    expect(result.casualCount).toBe(1);
  });

  it("counts letters created within the last 7 days", () => {
    const withinWeek = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    const overAWeekAgo = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    const result = computeCoverLetterStats(
      [
        { tone: "formal", createdAt: withinWeek },
        { tone: "casual", createdAt: overAWeekAgo },
      ],
      NOW
    );
    expect(result.addedThisWeek).toBe(1);
  });
});
