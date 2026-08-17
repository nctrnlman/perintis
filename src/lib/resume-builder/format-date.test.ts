import { describe, expect, it } from "vitest";
import { formatMonthYear } from "./format-date";

describe("formatMonthYear", () => {
  it("formats an ISO date string as month + year", () => {
    expect(formatMonthYear("2024-09-15")).toBe("Sep 2024");
  });

  it("returns an empty string for null", () => {
    expect(formatMonthYear(null)).toBe("");
  });
});
