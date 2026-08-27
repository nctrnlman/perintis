import { describe, expect, it } from "vitest";
import { analyzeContent } from "./content-analysis";

function categories(text: string): string[] {
  return analyzeContent(text).map((f) => f.category);
}

describe("analyzeContent", () => {
  it("flags missing email when no email address is present", () => {
    expect(categories("John Doe, Software Engineer, Jakarta")).toContain("missing-email");
  });

  it("does not flag missing email when an email address is present", () => {
    expect(categories("Contact: john.doe@example.com")).not.toContain("missing-email");
  });

  it("flags missing phone when no phone-like number is present", () => {
    expect(categories("John Doe, john@example.com")).toContain("missing-phone");
  });

  it("does not flag missing phone when a phone number is present", () => {
    expect(categories("Phone: 08123456789")).not.toContain("missing-phone");
  });

  it("flags inconsistent dates when multiple distinct formats are used", () => {
    const text = "Worked Jan 2020 - Dec 2021. Also 03/2019 - 05/2019.";
    expect(categories(text)).toContain("inconsistent-dates");
  });

  it("does not flag inconsistent dates when only one format is used", () => {
    const text = "Worked Jan 2020 - Dec 2021. Then Jan 2022 - Mar 2023.";
    expect(categories(text)).not.toContain("inconsistent-dates");
  });

  it("flags missing quantified achievements when no numbers are present", () => {
    const text = "Led a team and improved processes and helped customers succeed greatly.";
    expect(categories(text)).toContain("no-quantified-achievements");
  });

  it("does not flag missing quantified achievements when metrics are present", () => {
    const text = "Increased revenue by 40% and led a team of 10 engineers.";
    expect(categories(text)).not.toContain("no-quantified-achievements");
  });

  it("flags weak action verbs when weak phrases are used", () => {
    expect(categories("Responsible for managing the sales team.")).toContain(
      "weak-action-verbs"
    );
  });

  it("does not flag weak action verbs when only strong verbs are used", () => {
    expect(categories("Engineered and delivered custom solutions for OPS teams.")).not.toContain(
      "weak-action-verbs"
    );
  });
});
