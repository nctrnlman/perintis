import { describe, expect, it } from "vitest";
import { buildProfileContext } from "./build-profile-context";

const PROFILE_FIXTURE = {
  summary: "<p>Software engineer with 5 years of experience.</p>",
  targetRole: "Senior Software Engineer",
  targetIndustry: "Fintech",
  workExperiences: [
    {
      title: "Software Engineer",
      company: "Acme",
      startDate: new Date("2021-01-15"),
      endDate: null,
      description: "<p>Built the payments service.</p><p>Led a team of 3.</p>",
    },
  ],
  educations: [
    { institution: "Universitas Indonesia", degree: "S1", fieldOfStudy: "Ilmu Komputer" },
  ],
  skills: [{ name: "TypeScript" }, { name: "PostgreSQL" }],
  certifications: [{ name: "AWS Certified Developer", issuer: "Amazon" }],
  projects: [
    { name: "Internal Tooling", role: "Lead", description: "<p>Cut deploy time by half</p>" },
  ],
};

describe("buildProfileContext", () => {
  it("includes the target role and industry", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("Senior Software Engineer / Fintech");
  });

  it("strips HTML from the summary", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("Software engineer with 5 years of experience.");
    expect(result).not.toContain("<p>");
  });

  it("formats work experience with year range and stripped description lines", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("Software Engineer at Acme (2021-Present)");
    expect(result).toContain("Built the payments service.");
    expect(result).toContain("Led a team of 3.");
  });

  it("formats education, skills, certifications, and projects", () => {
    const result = buildProfileContext(PROFILE_FIXTURE);
    expect(result).toContain("S1 Ilmu Komputer at Universitas Indonesia");
    expect(result).toContain("Skills: TypeScript, PostgreSQL");
    expect(result).toContain("AWS Certified Developer (Amazon)");
    expect(result).toContain("Internal Tooling (Lead)");
    expect(result).toContain("Cut deploy time by half");
  });

  it("omits empty sections instead of printing empty headers", () => {
    const result = buildProfileContext({
      summary: null,
      targetRole: null,
      targetIndustry: null,
      workExperiences: [],
      educations: [],
      skills: [],
      certifications: [],
      projects: [],
    });
    expect(result).toBe("");
  });
});
