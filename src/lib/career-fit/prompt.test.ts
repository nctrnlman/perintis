import { describe, expect, it } from "vitest";
import { buildCareerFitPrompt } from "./prompt";

const BASE_INPUT = {
  profileContext: "Skills: TypeScript, React",
  matches: [
    { title: "Frontend Engineer", matchedSkills: ["TypeScript", "React"], missingSkills: ["Git"] },
    { title: "Full-Stack Engineer", matchedSkills: ["TypeScript"], missingSkills: ["Node.js", "SQL"] },
  ],
};

describe("buildCareerFitPrompt", () => {
  it("includes each role title", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Frontend Engineer");
    expect(prompt).toContain("Full-Stack Engineer");
  });

  it("includes matched and missing skills per role", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("TypeScript, React");
    expect(prompt).toContain("Node.js, SQL");
  });

  it("includes the profile context block", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Skills: TypeScript, React");
  });

  it("includes the exact-count return instruction", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Return exactly 2 paragraph(s)");
  });

  it("includes the no-fabrication hard rule", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Never invent employers, metrics, or accomplishments");
  });

  it("includes the no-market-claims hard rule", () => {
    const prompt = buildCareerFitPrompt(BASE_INPUT);
    expect(prompt).toContain("Never state or imply anything about job-market demand");
  });
});
