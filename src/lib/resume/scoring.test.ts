import { describe, expect, it } from "vitest";
import { scoreFindings } from "./scoring";
import type { Finding } from "./types";

function finding(severity: Finding["severity"]): Finding {
  return {
    category: "test",
    severity,
    explanation: "test",
    fixGuidance: "test",
  };
}

describe("scoreFindings", () => {
  it("returns 100 for no findings", () => {
    expect(scoreFindings([])).toBe(100);
  });

  it("subtracts 15 per critical finding", () => {
    expect(scoreFindings([finding("critical")])).toBe(85);
  });

  it("subtracts 5 per warning finding", () => {
    expect(scoreFindings([finding("warning")])).toBe(95);
  });

  it("does not subtract for suggestion findings", () => {
    expect(scoreFindings([finding("suggestion")])).toBe(100);
  });

  it("floors at 0", () => {
    const findings = Array.from({ length: 10 }, () => finding("critical"));
    expect(scoreFindings(findings)).toBe(0);
  });
});
