import { describe, expect, it } from "vitest";
import { buildCoverLetterPrompt } from "./prompt";

const BASE_INPUT = {
  companyName: "Acme Corp",
  positionTitle: "Software Engineer",
  jobPostingText: "We are looking for a software engineer with React experience.",
  tone: "formal" as const,
  length: "standard" as const,
  fullName: "Budi Santoso",
  profileContext: "Skills: TypeScript, React",
};

describe("buildCoverLetterPrompt", () => {
  it("includes the company name, position, and job posting text", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Acme Corp");
    expect(prompt).toContain("Software Engineer");
    expect(prompt).toContain("We are looking for a software engineer with React experience.");
  });

  it("includes the no-fabrication hard rule", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Never invent metrics, employers, job titles, or accomplishments");
  });

  it("includes a formal tone instruction for tone=formal", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("formal and professional");
  });

  it("includes a casual tone instruction for tone=casual", () => {
    const prompt = buildCoverLetterPrompt({ ...BASE_INPUT, tone: "casual" });
    expect(prompt).toContain("warm");
  });

  it("includes the short word-count target for length=short", () => {
    const prompt = buildCoverLetterPrompt({ ...BASE_INPUT, length: "short" });
    expect(prompt).toContain("150-200 words");
  });

  it("includes the standard word-count target for length=standard", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("250-350 words");
  });

  it("references the candidate's name when provided", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Budi Santoso");
  });

  it("falls back to a nameless closing instruction when fullName is null", () => {
    const prompt = buildCoverLetterPrompt({ ...BASE_INPUT, fullName: null });
    expect(prompt).toContain("without a name");
  });

  it("includes the profile context block", () => {
    const prompt = buildCoverLetterPrompt(BASE_INPUT);
    expect(prompt).toContain("Skills: TypeScript, React");
  });
});
