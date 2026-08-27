import { getScoreTier, type ScoreTier } from "@/lib/resume/scoring";

interface ScoreRingProps {
  score: number;
  size?: number;
  suffix?: string;
}

const TIER_COLOR: Record<ScoreTier, string> = {
  excellent: "stroke-emerald-500 text-emerald-500",
  good: "stroke-amber-500 text-amber-500",
  needsWork: "stroke-red-500 text-red-500",
};

export function ScoreRing({ score, size = 140, suffix = "" }: ScoreRingProps) {
  const strokeWidth = Math.max(4, Math.round(size * 0.07));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const tier = getScoreTier(clamped);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-700 ease-out ${TIER_COLOR[tier].split(" ")[0]}`}
        />
      </svg>
      <span
        className={`absolute font-semibold tabular-nums ${TIER_COLOR[tier].split(" ")[1]}`}
        style={{ fontSize: Math.max(13, Math.round(size * 0.22)) }}
      >
        {score}
        {suffix}
      </span>
    </div>
  );
}
