import { describe, expect, it } from "vitest";
import { parsePageParam, parseSortParam } from "./table-query";

describe("parsePageParam", () => {
  it("defaults to 1 when missing", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("parses a valid page number", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("clamps values below 1 to 1", () => {
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-5")).toBe(1);
  });

  it("defaults to 1 for non-numeric input", () => {
    expect(parsePageParam("abc")).toBe(1);
  });
});

describe("parseSortParam", () => {
  const allowed = ["date", "score", "filename"] as const;

  it("returns the fallback when missing", () => {
    expect(parseSortParam(undefined, allowed, "date")).toBe("date");
  });

  it("returns the value when it is allowed", () => {
    expect(parseSortParam("score", allowed, "date")).toBe("score");
  });

  it("returns the fallback when the value is not allowed", () => {
    expect(parseSortParam("bogus", allowed, "date")).toBe("date");
  });
});
