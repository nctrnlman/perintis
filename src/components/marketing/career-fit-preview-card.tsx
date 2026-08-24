interface CareerFitPreviewCardProps {
  strongLabel: string;
  goodLabel: string;
}

const TIER_STYLES: Record<"STRONG" | "GOOD", string> = {
  STRONG: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  GOOD: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const EXAMPLE_MATCHES = [
  {
    title: "Product Designer",
    tier: "STRONG" as const,
    skills: ["Figma", "User Research", "Prototyping"],
  },
  {
    title: "UI/UX Designer",
    tier: "GOOD" as const,
    skills: ["Figma", "Wireframing"],
  },
];

export function CareerFitPreviewCard({ strongLabel, goodLabel }: CareerFitPreviewCardProps) {
  const tierLabels: Record<"STRONG" | "GOOD", string> = { STRONG: strongLabel, GOOD: goodLabel };

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="space-y-3">
        {EXAMPLE_MATCHES.map((match) => (
          <div key={match.title} className="rounded-2xl bg-background p-4 ring-1 ring-border">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{match.title}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_STYLES[match.tier]}`}
              >
                {tierLabels[match.tier]}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {match.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
