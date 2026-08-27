export function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

interface PropertyRowProps {
  label: string;
  children: React.ReactNode;
}

export function PropertyRow({ label, children }: PropertyRowProps) {
  return (
    <div className="flex items-start gap-2.5 py-1">
      <span className="w-20 shrink-0 pt-1.5 text-xs text-muted-foreground">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
