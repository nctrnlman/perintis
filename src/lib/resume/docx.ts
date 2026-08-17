import JSZip from "jszip";
import mammoth from "mammoth";
import type { Finding } from "./types";

const SAFE_FONTS = [
  "arial",
  "helvetica",
  "calibri",
  "times new roman",
  "times",
  "georgia",
  "cambria",
  "garamond",
  "verdana",
];

function isSafeFont(fontName: string): boolean {
  const normalized = fontName.toLowerCase();
  return SAFE_FONTS.some((safe) => normalized.includes(safe));
}

export async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
  return result.value.trim();
}

export async function analyzeDocxStructure(buffer: ArrayBuffer): Promise<Finding[]> {
  const findings: Finding[] = [];
  const zip = await JSZip.loadAsync(buffer);

  const documentXmlFile = zip.file("word/document.xml");
  const documentXml = documentXmlFile ? await documentXmlFile.async("string") : "";

  if (documentXml.includes("<w:tbl>") || documentXml.includes("<w:tbl ")) {
    findings.push({
      category: "table-detected",
      severity: "warning",
      explanation: "Resume menggunakan tabel untuk mengatur tata letak.",
      fixGuidance:
        "Hindari tabel. Gunakan heading dan paragraf biasa agar urutan konten terbaca benar oleh ATS.",
    });
  }

  for (const partName of ["word/header1.xml", "word/footer1.xml"]) {
    const part = zip.file(partName);
    if (!part) continue;
    const xml = await part.async("string");
    const textMatches = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    const hasContent = textMatches.some((m) => m[1].trim().length > 0);
    if (hasContent) {
      findings.push({
        category: "header-footer-content",
        severity: "warning",
        explanation: `${
          partName.includes("header") ? "Header" : "Footer"
        } dokumen berisi teks, yang seringkali tidak terbaca oleh sistem ATS.`,
        fixGuidance:
          "Pindahkan informasi penting (kontak, nama) ke badan utama dokumen, bukan header/footer.",
      });
    }
  }

  const fontMatches = [...documentXml.matchAll(/<w:rFonts[^>]*w:ascii="([^"]+)"/g)];
  const fontNames = new Set(fontMatches.map((m) => m[1]));
  for (const fontName of fontNames) {
    if (!isSafeFont(fontName)) {
      findings.push({
        category: "non-standard-font",
        severity: "suggestion",
        explanation: `Font "${fontName}" mungkin tidak dikenali oleh semua sistem ATS.`,
        fixGuidance:
          "Gunakan font standar seperti Arial, Calibri, atau Times New Roman.",
      });
      break;
    }
  }

  return findings;
}
