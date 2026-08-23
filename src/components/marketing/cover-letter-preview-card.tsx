interface CoverLetterPreviewCardProps {
  companyLabel: string;
  positionLabel: string;
  greetingLine: string;
  bodyLines: string[];
  pdfLabel: string;
  wordLabel: string;
}

export function CoverLetterPreviewCard({
  companyLabel,
  positionLabel,
  greetingLine,
  bodyLines,
  pdfLabel,
  wordLabel,
}: CoverLetterPreviewCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
        <p className="text-lg font-semibold">{positionLabel}</p>
        <p className="text-sm text-muted-foreground">{companyLabel}</p>
        <div className="mt-4 h-px bg-border" />

        <p className="mt-4 text-sm text-muted-foreground">{greetingLine}</p>
        <div className="mt-3 space-y-2">
          {bodyLines.map((line, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              {line}
            </p>
          ))}
        </div>

        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{pdfLabel}</span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{wordLabel}</span>
        </div>
      </div>
    </div>
  );
}
