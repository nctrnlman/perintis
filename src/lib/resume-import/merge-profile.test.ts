import { describe, expect, it } from "vitest";
import { buildPersonalInfoPatch } from "./merge-profile";

describe("buildPersonalInfoPatch", () => {
  it("fills fields that are currently empty", () => {
    const existing = {
      fullName: null,
      phone: null,
      location: null,
      linkedinUrl: null,
      portfolioUrl: null,
      summary: null,
    };
    const patch = buildPersonalInfoPatch(existing, {
      fullName: "Jane Doe",
      phone: "08123456789",
      location: "Jakarta",
      linkedinUrl: "https://linkedin.com/in/jane",
      portfolioUrl: "https://jane.dev",
      summary: "<p>Experienced engineer.</p>",
    });

    expect(patch).toEqual({
      fullName: "Jane Doe",
      phone: "08123456789",
      location: "Jakarta",
      linkedinUrl: "https://linkedin.com/in/jane",
      portfolioUrl: "https://jane.dev",
      summary: "<p>Experienced engineer.</p>",
    });
  });

  it("never overwrites fields that already have a value", () => {
    const existing = {
      fullName: "Existing Name",
      phone: null,
      location: null,
      linkedinUrl: null,
      portfolioUrl: null,
      summary: null,
    };
    const patch = buildPersonalInfoPatch(existing, {
      fullName: "Extracted Name",
      phone: "08123456789",
    });

    expect(patch).toEqual({ phone: "08123456789" });
  });

  it("returns an empty patch when extraction found nothing new", () => {
    const existing = {
      fullName: "Existing Name",
      phone: null,
      location: null,
      linkedinUrl: null,
      portfolioUrl: null,
      summary: null,
    };
    const patch = buildPersonalInfoPatch(existing, {});

    expect(patch).toEqual({});
  });
});
