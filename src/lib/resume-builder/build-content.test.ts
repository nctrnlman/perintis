import { describe, expect, it } from "vitest";
import { buildContentFromProfile } from "./build-content";

const PROFILE_FIXTURE = {
  fullName: "Budi Santoso",
  phone: "+62 812-0000-0000",
  location: "Jakarta, Indonesia",
  linkedinUrl: "linkedin.com/in/budi",
  portfolioUrl: null,
  summary: "Software engineer.",
  workExperiences: [
    {
      id: "we-1",
      title: "Software Engineer",
      company: "Acme",
      location: "Jakarta",
      startDate: new Date("2023-01-15"),
      endDate: null,
      description: "Built the thing.\nShipped the other thing.\n\n",
    },
  ],
  educations: [
    {
      id: "ed-1",
      institution: "Universitas Indonesia",
      degree: "S1",
      fieldOfStudy: "Ilmu Komputer",
      startDate: new Date("2018-08-01"),
      endDate: new Date("2022-07-01"),
    },
  ],
  skills: [{ id: "sk-1", name: "TypeScript", category: "Hard Skills" }],
  certifications: [
    {
      id: "ce-1",
      name: "AWS Certified Developer",
      issuer: "Amazon",
      issueDate: new Date("2023-06-01"),
      url: null,
    },
  ],
  projects: [
    {
      id: "pr-1",
      name: "Dulux Design Competition",
      client: null,
      role: "Lead Backend",
      bullets: ["Built a platform."],
      techStack: ["Next.js"],
    },
  ],
  languages: [{ id: "la-1", name: "English", proficiency: "Proficient" }],
};

describe("buildContentFromProfile", () => {
  it("maps personal info, using the given email since Profile has none", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.personalInfo.fullName).toBe("Budi Santoso");
    expect(content.personalInfo.email).toBe("budi@example.com");
    expect(content.personalInfo.portfolioUrl).toBe("");
  });

  it("splits work experience description into bullets, dropping blank lines", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.workExperiences[0].bullets).toEqual([
      "Built the thing.",
      "Shipped the other thing.",
    ]);
  });

  it("formats dates as YYYY-MM-DD strings and preserves null end dates", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.workExperiences[0].startDate).toBe("2023-01-15");
    expect(content.workExperiences[0].endDate).toBeNull();
  });

  it("defaults education location and bullets to empty since Profile doesn't track them", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.educations[0].location).toBe("");
    expect(content.educations[0].bullets).toEqual([]);
  });

  it("copies project bullets and techStack as-is", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.projects[0].bullets).toEqual(["Built a platform."]);
    expect(content.projects[0].techStack).toEqual(["Next.js"]);
  });

  it("coerces null optional strings to empty strings, e.g. certification url", () => {
    const content = buildContentFromProfile(PROFILE_FIXTURE, "budi@example.com");
    expect(content.certifications[0].url).toBe("");
    expect(content.certifications[0].issueDate).toBe("2023-06-01");
  });
});
