interface ResumePreviewCardProps {
  name: string;
  role: string;
  experienceLabel: string;
  bullets: string[];
  skillsLabel: string;
  skills: string[];
}

export function ResumePreviewCard({
  name,
  role,
  experienceLabel,
  bullets,
  skillsLabel,
  skills,
}: ResumePreviewCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
      <div className="rounded-2xl bg-background p-6 ring-1 ring-border">
        <p className="text-lg font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
        <div className="mt-4 h-px bg-border" />

        <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {experienceLabel}
        </p>
        <ul className="mt-2 space-y-1.5">
          {bullets.map((bullet, index) => (
            <li key={index} className="flex gap-2 text-xs text-muted-foreground">
              <span className="mt-[5px] size-1 shrink-0 rounded-full bg-muted-foreground" />
              {bullet}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {skillsLabel}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span key={skill} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
