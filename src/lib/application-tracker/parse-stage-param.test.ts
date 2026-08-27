import { describe, expect, it } from "vitest";
import { parseStageParam } from "./parse-stage-param";

describe("parseStageParam", () => {
  it("returns the value when it's a valid stage", () => {
    expect(parseStageParam("INTERVIEWING")).toBe("INTERVIEWING");
  });

  it("defaults to APPLIED when undefined", () => {
    expect(parseStageParam(undefined)).toBe("APPLIED");
  });

  it("defaults to APPLIED for an invalid value", () => {
    expect(parseStageParam("NOT_A_STAGE")).toBe("APPLIED");
  });

  it("uses the first element when given an array", () => {
    expect(parseStageParam(["OFFER", "REJECTED"])).toBe("OFFER");
  });

  it("defaults to APPLIED when the first array element is invalid", () => {
    expect(parseStageParam(["NOT_A_STAGE"])).toBe("APPLIED");
  });
});
