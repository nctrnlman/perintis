import { describe, expect, it } from "vitest";
import { computeProfileCompleteness } from "./profile-completeness";

const EMPTY = {
  fullName: null,
  phone: null,
  location: null,
  summary: null,
  targetRole: null,
  workExperienceCount: 0,
  educationCount: 0,
  skillCount: 0,
};

describe("computeProfileCompleteness", () => {
  it("returns 0% and all items missing for an empty profile", () => {
    const result = computeProfileCompleteness(EMPTY);
    expect(result.percentage).toBe(0);
    expect(result.missing).toEqual([
      "basicInfo",
      "summary",
      "targetRole",
      "workExperience",
      "education",
      "skills",
    ]);
  });

  it("returns 100% and no missing items for a fully filled profile", () => {
    const result = computeProfileCompleteness({
      fullName: "Jane Doe",
      phone: "08123456789",
      location: "Jakarta",
      summary: "Experienced engineer.",
      targetRole: "Software Engineer",
      workExperienceCount: 1,
      educationCount: 1,
      skillCount: 3,
    });
    expect(result.percentage).toBe(100);
    expect(result.missing).toEqual([]);
  });

  it("only counts basicInfo complete when all three fields are present", () => {
    const result = computeProfileCompleteness({
      ...EMPTY,
      fullName: "Jane Doe",
      phone: "08123456789",
    });
    expect(result.missing).toContain("basicInfo");
  });

  it("computes a partial percentage", () => {
    const result = computeProfileCompleteness({
      ...EMPTY,
      fullName: "Jane Doe",
      phone: "08123456789",
      location: "Jakarta",
      workExperienceCount: 1,
    });
    expect(result.percentage).toBe(33);
    expect(result.missing).toEqual(["summary", "targetRole", "education", "skills"]);
  });
});
