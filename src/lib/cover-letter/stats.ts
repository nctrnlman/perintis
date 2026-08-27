export interface CoverLetterStatsInput {
  tone: string;
  createdAt: Date;
}

export interface CoverLetterAggregateStats {
  total: number;
  formalCount: number;
  casualCount: number;
  addedThisWeek: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeCoverLetterStats(
  letters: CoverLetterStatsInput[],
  now: Date = new Date()
): CoverLetterAggregateStats {
  const total = letters.length;
  const formalCount = letters.filter((letter) => letter.tone === "formal").length;
  const casualCount = letters.filter((letter) => letter.tone === "casual").length;

  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const addedThisWeek = letters.filter((letter) => letter.createdAt >= weekAgo).length;

  return { total, formalCount, casualCount, addedThisWeek };
}
