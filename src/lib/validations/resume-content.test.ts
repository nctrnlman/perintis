import { describe, expect, it } from "vitest";
import { resumeContentSchema } from "./resume-content";

const VALID_CONTENT = {
  personalInfo: {
    fullName: "Budi Santoso",
    email: "budi@example.com",
    phone: "+62 812-0000-0000",
    location: "Jakarta, Indonesia",
    linkedinUrl: "",
    portfolioUrl: "",
  },
  summary: "Software engineer with 3 years of experience.",
  workExperiences: [
    {
      id: "we-1",
      title: "Software Engineer",
      company: "Acme",
      location: "Jakarta",
      startDate: "2023-01-01",
      endDate: null,
      bullets: ["Built a thing."],
    },
  ],
  educations: [],
  skills: [{ id: "sk-1", name: "TypeScript", category: "Hard Skills" }],
  certifications: [],
  projects: [],
  languages: [],
};

describe("resumeContentSchema", () => {
  it("accepts a fully valid content object", () => {
    expect(resumeContentSchema.safeParse(VALID_CONTENT).success).toBe(true);
  });

  it("rejects a missing personalInfo.fullName", () => {
    const invalid = {
      ...VALID_CONTENT,
      personalInfo: { ...VALID_CONTENT.personalInfo, fullName: undefined },
    };
    expect(resumeContentSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a work experience entry missing an id", () => {
    const invalid = {
      ...VALID_CONTENT,
      workExperiences: [{ ...VALID_CONTENT.workExperiences[0], id: undefined }],
    };
    expect(resumeContentSchema.safeParse(invalid).success).toBe(false);
  });

  it("accepts an empty content object with all arrays empty", () => {
    const empty = {
      personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        linkedinUrl: "",
        portfolioUrl: "",
      },
      summary: "",
      workExperiences: [],
      educations: [],
      skills: [],
      certifications: [],
      projects: [],
      languages: [],
    };
    expect(resumeContentSchema.safeParse(empty).success).toBe(true);
  });
});
