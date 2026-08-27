import { describe, expect, it } from "vitest";
import { computeApplicationStats, type ApplicationStatsInput } from "./stats";

const NOW = new Date("2026-08-25T12:00:00.000Z");

function app(
  stage: ApplicationStatsInput["stage"],
  overrides: Partial<Pick<ApplicationStatsInput, "createdAt" | "updatedAt">> = {}
): ApplicationStatsInput {
  return {
    stage,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

describe("computeApplicationStats", () => {
  it("returns all zeros and null rates for no applications", () => {
    const result = computeApplicationStats([], NOW);
    expect(result).toEqual({
      total: 0,
      activePipeline: 0,
      winRate: null,
      interviewConversion: null,
      addedThisWeek: 0,
      staleCount: 0,
      perStage: {
        WISHLIST: 0,
        APPLIED: 0,
        INTERVIEWING: 0,
        OFFER: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
      },
    });
  });

  it("counts total and active pipeline correctly", () => {
    const result = computeApplicationStats(
      [app("APPLIED"), app("INTERVIEWING"), app("ACCEPTED"), app("REJECTED"), app("WITHDRAWN")],
      NOW
    );
    expect(result.total).toBe(5);
    expect(result.activePipeline).toBe(2); // APPLIED, INTERVIEWING
  });

  it("computes win rate from decided applications only", () => {
    const result = computeApplicationStats(
      [app("ACCEPTED"), app("ACCEPTED"), app("REJECTED"), app("APPLIED")],
      NOW
    );
    expect(result.winRate).toBe(67); // 2/3 rounded
  });

  it("returns null win rate when nothing has been decided yet", () => {
    const result = computeApplicationStats(
      [app("APPLIED"), app("INTERVIEWING"), app("WISHLIST")],
      NOW
    );
    expect(result.winRate).toBeNull();
  });

  it("computes interview conversion excluding wishlist from the denominator", () => {
    const result = computeApplicationStats(
      [app("WISHLIST"), app("APPLIED"), app("INTERVIEWING"), app("REJECTED")],
      NOW
    );
    // denominator = 3 (APPLIED, INTERVIEWING, REJECTED), numerator = 2 (INTERVIEWING, REJECTED)
    expect(result.interviewConversion).toBe(67);
  });

  it("returns null interview conversion when everything is still wishlist", () => {
    const result = computeApplicationStats([app("WISHLIST"), app("WISHLIST")], NOW);
    expect(result.interviewConversion).toBeNull();
  });

  it("counts applications added within the last 7 days", () => {
    const withinWeek = new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000);
    const overAWeekAgo = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    const result = computeApplicationStats(
      [app("APPLIED", { createdAt: withinWeek }), app("APPLIED", { createdAt: overAWeekAgo })],
      NOW
    );
    expect(result.addedThisWeek).toBe(1);
  });

  it("counts active-pipeline applications not updated in 14+ days as stale", () => {
    const recentlyUpdated = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000);
    const staleUpdate = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000);
    const result = computeApplicationStats(
      [
        app("APPLIED", { updatedAt: recentlyUpdated }),
        app("INTERVIEWING", { updatedAt: staleUpdate }),
        // terminal stage should never count as stale, even if old
        app("REJECTED", { updatedAt: staleUpdate }),
      ],
      NOW
    );
    expect(result.staleCount).toBe(1);
  });

  it("breaks down counts per stage", () => {
    const result = computeApplicationStats(
      [app("APPLIED"), app("APPLIED"), app("INTERVIEWING")],
      NOW
    );
    expect(result.perStage).toEqual({
      WISHLIST: 0,
      APPLIED: 2,
      INTERVIEWING: 1,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    });
  });
});
