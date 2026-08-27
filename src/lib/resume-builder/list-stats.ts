export interface ResumeListStatsInput {
  createdAt: Date;
}

export interface ResumeListAggregateStats {
  total: number;
  addedThisWeek: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeResumeListStats(
  documents: ResumeListStatsInput[],
  now: Date = new Date()
): ResumeListAggregateStats {
  const total = documents.length;
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const addedThisWeek = documents.filter((doc) => doc.createdAt >= weekAgo).length;

  return { total, addedThisWeek };
}
