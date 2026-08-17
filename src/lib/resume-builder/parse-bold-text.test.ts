import { describe, expect, it } from "vitest";
import { parseBoldSegments } from "./parse-bold-text";

describe("parseBoldSegments", () => {
  it("returns a single non-bold segment for plain text", () => {
    expect(parseBoldSegments("Engineered scalable systems")).toEqual([
      { text: "Engineered scalable systems", bold: false },
    ]);
  });

  it("splits text with one bold marker into plain/bold/plain", () => {
    expect(parseBoldSegments("Reduced errors by **40%** company-wide")).toEqual([
      { text: "Reduced errors by ", bold: false },
      { text: "40%", bold: true },
      { text: " company-wide", bold: false },
    ]);
  });

  it("handles a string that is entirely bold", () => {
    expect(parseBoldSegments("**Fully bold**")).toEqual([{ text: "Fully bold", bold: true }]);
  });

  it("handles multiple bold markers", () => {
    expect(parseBoldSegments("**A** and **B**")).toEqual([
      { text: "A", bold: true },
      { text: " and ", bold: false },
      { text: "B", bold: true },
    ]);
  });

  it("treats an unmatched ** as literal text", () => {
    expect(parseBoldSegments("just ** a stray marker")).toEqual([
      { text: "just ** a stray marker", bold: false },
    ]);
  });

  it("returns a single empty segment for an empty string", () => {
    expect(parseBoldSegments("")).toEqual([{ text: "", bold: false }]);
  });
});
