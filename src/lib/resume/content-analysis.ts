import type { Finding } from "./types";

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/;
const QUANTIFIED_PATTERN = /\d+(\.\d+)?%|\b\d{2,}\b/;

const WEAK_PHRASES = [
  "responsible for",
  "worked on",
  "helped with",
  "helped to",
  "duties included",
  "in charge of",
  "tasked with",
];

const MONTH_NAME_DATE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/gi;
const SLASH_MM_YYYY_DATE = /\b\d{1,2}\/\d{4}\b/g;
const ISO_YYYY_MM_DATE = /\b\d{4}-\d{2}\b/g;
const SLASH_FULL_DATE = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;

export function analyzeContent(rawText: string): Finding[] {
  const findings: Finding[] = [];
  const lowerText = rawText.toLowerCase();

  if (!EMAIL_PATTERN.test(rawText)) {
    findings.push({
      category: "missing-email",
      severity: "warning",
      explanation: "Tidak ditemukan alamat email di resume Anda.",
      fixGuidance:
        "Tambahkan alamat email aktif di bagian info kontak agar recruiter dan sistem ATS bisa menghubungi Anda.",
    });
  }

  if (!PHONE_PATTERN.test(rawText)) {
    findings.push({
      category: "missing-phone",
      severity: "warning",
      explanation: "Tidak ditemukan nomor telepon di resume Anda.",
      fixGuidance:
        "Tambahkan nomor telepon aktif di bagian info kontak agar mudah dihubungi.",
    });
  }

  const dateFormatCounts = [
    MONTH_NAME_DATE,
    SLASH_MM_YYYY_DATE,
    ISO_YYYY_MM_DATE,
    SLASH_FULL_DATE,
  ].filter((pattern) => (rawText.match(pattern)?.length ?? 0) > 0).length;

  if (dateFormatCounts > 1) {
    findings.push({
      category: "inconsistent-dates",
      severity: "suggestion",
      explanation: "Resume Anda menggunakan lebih dari satu format tanggal yang berbeda.",
      fixGuidance:
        "Gunakan satu format tanggal yang konsisten di seluruh resume (misalnya \"Jan 2020\") agar sistem ATS bisa membaca urutan waktu dengan benar.",
    });
  }

  if (!QUANTIFIED_PATTERN.test(rawText)) {
    findings.push({
      category: "no-quantified-achievements",
      severity: "suggestion",
      explanation: "Belum ditemukan angka atau metrik yang mengukur pencapaian Anda.",
      fixGuidance:
        "Tambahkan angka konkret pada pencapaian Anda (contoh: \"meningkatkan penjualan 20%\", \"memimpin tim 5 orang\") agar lebih meyakinkan bagi recruiter.",
    });
  }

  const foundWeakPhrases = WEAK_PHRASES.filter((phrase) => lowerText.includes(phrase));
  if (foundWeakPhrases.length > 0) {
    findings.push({
      category: "weak-action-verbs",
      severity: "suggestion",
      explanation: `Ditemukan frasa pasif seperti "${foundWeakPhrases[0]}" yang kurang kuat untuk resume.`,
      fixGuidance:
        "Ganti dengan kata kerja aktif yang kuat (misalnya \"Memimpin\", \"Membangun\", \"Merancang\") untuk menunjukkan kontribusi Anda secara langsung.",
    });
  }

  return findings;
}
