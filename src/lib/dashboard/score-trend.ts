export function buildTrendPath(
  scores: number[],
  width: number,
  height: number,
  padding = 4
): string {
  if (scores.length === 0) return "";

  if (scores.length === 1) {
    const y = height / 2;
    return `M0,${y} L${width},${y}`;
  }

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  const stepX = width / (scores.length - 1);
  const usableHeight = height - padding * 2;

  return scores
    .map((score, index) => {
      const x = index * stepX;
      const normalized = range === 0 ? 0.5 : (score - min) / range;
      const y = padding + (1 - normalized) * usableHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export function computeTrendDelta(scores: number[]): number | null {
  if (scores.length < 2) return null;
  return scores[scores.length - 1] - scores[scores.length - 2];
}
