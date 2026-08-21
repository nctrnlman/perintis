import { describe, expect, it } from "vitest";
import { generateCoverLetterSchema, updateCoverLetterSchema } from "./cover-letter";

describe("generateCoverLetterSchema", () => {
  it("accepts valid input", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for a software engineer...",
      tone: "formal",
      length: "standard",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty company name", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for...",
      tone: "formal",
      length: "standard",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown tone value", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for...",
      tone: "sarcastic",
      length: "standard",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown length value", () => {
    const result = generateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      jobPostingText: "We are looking for...",
      tone: "formal",
      length: "very-long",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateCoverLetterSchema", () => {
  it("accepts valid input, including an empty bodyHtml (user cleared the editor)", () => {
    const result = updateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "Software Engineer",
      bodyHtml: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty position title", () => {
    const result = updateCoverLetterSchema.safeParse({
      companyName: "Acme Corp",
      positionTitle: "",
      bodyHtml: "<p>Hello</p>",
    });
    expect(result.success).toBe(false);
  });
});
