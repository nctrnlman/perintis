import { describe, expect, it } from "vitest";
import {
  certificationSchema,
  educationSchema,
  languageSchema,
  personalInfoSchema,
  projectSchema,
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

describe("personalInfoSchema summary field", () => {
  it("accepts a summary string", () => {
    const result = personalInfoSchema.safeParse({ summary: "Experienced engineer." });
    expect(result.success).toBe(true);
  });

  it("still accepts input with no summary", () => {
    expect(personalInfoSchema.safeParse({}).success).toBe(true);
  });
});

describe("certificationSchema", () => {
  it("requires a name and issuer", () => {
    const result = certificationSchema.safeParse({ name: "", issuer: "" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid certification with no issueDate or url", () => {
    const result = certificationSchema.safeParse({
      name: "AWS Certified Developer",
      issuer: "Amazon",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid url", () => {
    const result = certificationSchema.safeParse({
      name: "AWS Certified Developer",
      issuer: "Amazon",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("projectSchema", () => {
  it("requires a name", () => {
    expect(projectSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("accepts a valid project with description and techStack", () => {
    const result = projectSchema.safeParse({
      name: "Dulux Design Competition",
      client: "Dulux Indonesia",
      role: "Lead Backend",
      description: "<ul><li>Built a high-traffic competition platform.</li></ul>",
      techStack: ["Next.js", "Node.js"],
    });
    expect(result.success).toBe(true);
  });
});

describe("languageSchema", () => {
  it("requires a name and proficiency", () => {
    expect(languageSchema.safeParse({ name: "", proficiency: "" }).success).toBe(false);
  });

  it("accepts a valid language", () => {
    const result = languageSchema.safeParse({ name: "English", proficiency: "Proficient" });
    expect(result.success).toBe(true);
  });
});
