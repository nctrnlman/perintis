import { describe, expect, it } from "vitest";
import { buildTrendPath, computeTrendDelta } from "./score-trend";

describe("buildTrendPath", () => {
  it("returns an empty string for no scores", () => {
    expect(buildTrendPath([], 100, 32)).toBe("");
  });

  it("returns a flat horizontal line for a single score", () => {
    expect(buildTrendPath([80], 100, 32)).toBe("M0,16 L100,16");
  });

  it("plots every point left to right for multiple scores", () => {
    const path = buildTrendPath([50, 100], 100, 32, 0);
    expect(path).toBe("M0.00,32.00 L100.00,0.00");
  });

  it("does not divide by zero when every score is equal", () => {
    const path = buildTrendPath([70, 70, 70], 100, 32, 0);
    expect(path).toBe("M0.00,16.00 L50.00,16.00 L100.00,16.00");
  });
});

describe("computeTrendDelta", () => {
  it("returns null when there are fewer than 2 scores", () => {
    expect(computeTrendDelta([])).toBeNull();
    expect(computeTrendDelta([80])).toBeNull();
  });

  it("returns the difference between the last two scores", () => {
    expect(computeTrendDelta([60, 75])).toBe(15);
    expect(computeTrendDelta([80, 65])).toBe(-15);
    expect(computeTrendDelta([50, 60, 55])).toBe(-5);
  });
});
