import { PDFDocument, StandardFonts } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { analyzePdfStructure, extractPdfText } from "./pdf";

async function makeSingleColumnPdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("Budi Santoso", { x: 50, y: 750, size: 14, font });
  page.drawText("Software Engineer with 5 years of experience", {
    x: 50,
    y: 720,
    size: 11,
    font,
  });
  const bytes = await doc.save();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

async function makeTwoColumnPdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let row = 0; row < 6; row++) {
    const y = 750 - row * 20;
    page.drawText("Left column line", { x: 50, y, size: 11, font });
    page.drawText("Right column line", { x: 350, y, size: 11, font });
  }
  const bytes = await doc.save();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

async function makeUnusualFontPdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Courier);
  page.drawText("Budi Santoso", { x: 50, y: 750, size: 14, font });
  const bytes = await doc.save();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

async function makeBulletSymbolFontPdf(): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const bodyFont = await doc.embedFont(StandardFonts.Helvetica);
  const symbolFont = await doc.embedFont(StandardFonts.Symbol);
  page.drawText("!", { x: 50, y: 750, size: 12, font: symbolFont });
  page.drawText("Managed a team of five engineers", {
    x: 65,
    y: 750,
    size: 12,
    font: bodyFont,
  });
  const bytes = await doc.save();
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

describe("extractPdfText", () => {
  it("extracts visible text from a PDF", async () => {
    const buffer = await makeSingleColumnPdf();
    const text = await extractPdfText(buffer);
    expect(text).toContain("Budi Santoso");
    expect(text).toContain("Software Engineer");
  });
});

describe("analyzePdfStructure", () => {
  it("does not flag a single-column layout", async () => {
    const buffer = await makeSingleColumnPdf();
    const findings = await analyzePdfStructure(buffer);
    expect(findings.some((f) => f.category === "multi-column-layout")).toBe(false);
  });

  it("flags a two-column layout", async () => {
    const buffer = await makeTwoColumnPdf();
    const findings = await analyzePdfStructure(buffer);
    expect(findings.some((f) => f.category === "multi-column-layout")).toBe(true);
  });

  it("flags a non-standard font", async () => {
    const buffer = await makeUnusualFontPdf();
    const findings = await analyzePdfStructure(buffer);
    expect(findings.some((f) => f.category === "non-standard-font")).toBe(true);
  });

  it("does not flag a standard font", async () => {
    const buffer = await makeSingleColumnPdf();
    const findings = await analyzePdfStructure(buffer);
    expect(findings.some((f) => f.category === "non-standard-font")).toBe(false);
  });

  it("does not flag a Symbol-font bullet glyph next to a standard body font", async () => {
    const buffer = await makeBulletSymbolFontPdf();
    const findings = await analyzePdfStructure(buffer);
    expect(findings.some((f) => f.category === "non-standard-font")).toBe(false);
  });
});
