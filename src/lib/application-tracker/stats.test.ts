import { describe, expect, it } from "vitest";
import { computeApplicationStats } from "./stats";

describe("computeApplicationStats", () => {
  it("returns all zeros and null rates for no applications", () => {
    const result = computeApplicationStats([]);
    expect(result).toEqual({
      total: 0,
      activePipeline: 0,
      winRate: null,
      interviewConversion: null,
    });
  });

  it("counts total and active pipeline correctly", () => {
    const result = computeApplicationStats([
      "APPLIED",
      "INTERVIEWING",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
    ]);
    expect(result.total).toBe(5);
    expect(result.activePipeline).toBe(2); // APPLIED, INTERVIEWING
  });

  it("computes win rate from decided applications only", () => {
    const result = computeApplicationStats(["ACCEPTED", "ACCEPTED", "REJECTED", "APPLIED"]);
    expect(result.winRate).toBe(67); // 2/3 rounded
  });

  it("returns null win rate when nothing has been decided yet", () => {
    const result = computeApplicationStats(["APPLIED", "INTERVIEWING", "WISHLIST"]);
    expect(result.winRate).toBeNull();
  });

  it("computes interview conversion excluding wishlist from the denominator", () => {
    const result = computeApplicationStats([
      "WISHLIST",
      "APPLIED",
      "INTERVIEWING",
      "REJECTED",
    ]);
    // denominator = 3 (APPLIED, INTERVIEWING, REJECTED), numerator = 2 (INTERVIEWING, REJECTED)
    expect(result.interviewConversion).toBe(67);
  });

  it("returns null interview conversion when everything is still wishlist", () => {
    const result = computeApplicationStats(["WISHLIST", "WISHLIST"]);
    expect(result.interviewConversion).toBeNull();
  });
});
