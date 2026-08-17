import { describe, expect, it } from "vitest";
import {
  educationSchema,
  personalInfoSchema,
  skillSchema,
  workExperienceSchema,
} from "./profile";

describe("personalInfoSchema", () => {
  it("accepts all-empty input", () => {
    expect(personalInfoSchema.safeParse({}).success).toBe(true);
  });

  it("rejects an invalid LinkedIn URL", () => {
    const result = personalInfoSchema.safeParse({ linkedinUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("accepts an empty string for optional URL fields", () => {
    const result = personalInfoSchema.safeParse({
      linkedinUrl: "",
      portfolioUrl: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("workExperienceSchema", () => {
  it("requires a title and company", () => {
    const result = workExperienceSchema.safeParse({
      title: "",
      company: "",
      startDate: "2023-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid entry with no end date (still working)", () => {
    const result = workExperienceSchema.safeParse({
      title: "Software Engineer",
      company: "Perintis",
      startDate: "2023-01-01",
      skillsUsed: ["TypeScript"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = workExperienceSchema.safeParse({
      title: "Software Engineer",
      company: "Perintis",
      startDate: "2023-06-01",
      endDate: "2023-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an end date after the start date", () => {
    const result = workExperienceSchema.safeParse({
      title: "Software Engineer",
      company: "Perintis",
      startDate: "2023-01-01",
      endDate: "2023-06-01",
    });
    expect(result.success).toBe(true);
  });
});

describe("educationSchema", () => {
  it("requires an institution", () => {
    const result = educationSchema.safeParse({
      institution: "",
      startDate: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an end date before the start date", () => {
    const result = educationSchema.safeParse({
      institution: "Universitas Indonesia",
      startDate: "2020-01-01",
      endDate: "2019-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid entry", () => {
    const result = educationSchema.safeParse({
      institution: "Universitas Indonesia",
      degree: "S1",
      fieldOfStudy: "Ilmu Komputer",
      startDate: "2018-08-01",
      endDate: "2022-07-01",
    });
    expect(result.success).toBe(true);
  });
});

describe("skillSchema", () => {
  it("requires a name", () => {
    expect(skillSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts a valid skill", () => {
    const result = skillSchema.safeParse({
      name: "TypeScript",
      category: "Bahasa Pemrograman",
    });
    expect(result.success).toBe(true);
  });
});
