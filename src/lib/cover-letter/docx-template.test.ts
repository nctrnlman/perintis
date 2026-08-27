import { describe, expect, it } from "vitest";
import { Packer } from "docx";
import { buildCoverLetterDocx } from "./docx-template";

describe("buildCoverLetterDocx", () => {
  it("renders a complete cover letter document to a non-empty buffer", async () => {
    const document = buildCoverLetterDocx({
      companyName: "Acme Corp",
      createdAt: new Date("2026-08-22"),
      bodyHtml: "<p>Dear Hiring Team,</p><p>I am excited to apply.</p>",
      fullName: "Budi Santoso",
      email: "budi@example.com",
      phone: "+62 812-0000-0000",
      linkedinUrl: "linkedin.com/in/budisantoso",
      location: "Jakarta, Indonesia",
    });

    const buffer = await Packer.toBuffer(document);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
