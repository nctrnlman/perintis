import type { Finding } from "./types";

export function scoreFindings(findings: Finding[]): number {
  let score = 100;
  for (const finding of findings) {
    if (finding.severity === "critical") score -= 15;
    else if (finding.severity === "warning") score -= 5;
  }
  return Math.max(0, score);
}

export type ScoreTier = "excellent" | "good" | "needsWork";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  return "needsWork";
}
