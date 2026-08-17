import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Finding } from "./types";

const SAFE_FONTS = [
  "arial",
  "helvetica",
  "calibri",
  "times",
  "times-roman",
  "times new roman",
  "georgia",
  "cambria",
  "garamond",
  "verdana",
];

function isSafeFont(fontName: string): boolean {
  const normalized = fontName.toLowerCase();
  return SAFE_FONTS.some((safe) => normalized.includes(safe));
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ") + "\n";
  }
  return text.trim();
}

export async function analyzePdfStructure(buffer: ArrayBuffer): Promise<Finding[]> {
  const findings: Finding[] = [];
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const page = await pdf.getPage(1);

  // Must run before commonObjs.get() resolves font objects.
  await page.getOperatorList();
  const content = await page.getTextContent();

  const xPositions: number[] = [];
  const fontNames = new Set<string>();

  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    xPositions.push(item.transform[4]);
    if ("fontName" in item) {
      const fontObj = page.commonObjs.get(item.fontName) as
        | { name?: string }
        | undefined;
      if (fontObj?.name) fontNames.add(fontObj.name);
    }
  }

  if (xPositions.length > 4) {
    const viewport = page.getViewport({ scale: 1 });
    const midpoint = viewport.width / 2;
    const leftCount = xPositions.filter((x) => x < midpoint - 20).length;
    const rightCount = xPositions.filter((x) => x > midpoint + 20).length;
    const total = xPositions.length;

    if (leftCount / total > 0.2 && rightCount / total > 0.2) {
      findings.push({
        category: "multi-column-layout",
        severity: "warning",
        explanation: "Resume tampak menggunakan tata letak multi-kolom.",
        fixGuidance:
          "Gunakan tata letak satu kolom agar urutan teks terbaca benar oleh sistem ATS.",
      });
    }
  }

  for (const fontName of fontNames) {
    if (!isSafeFont(fontName)) {
      findings.push({
        category: "non-standard-font",
        severity: "suggestion",
        explanation: `Font "${fontName}" mungkin tidak dikenali oleh semua sistem ATS.`,
        fixGuidance:
          "Gunakan font standar seperti Arial, Calibri, atau Times New Roman.",
      });
    }
  }

  return findings;
}
