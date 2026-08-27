export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="h-48 rounded-2xl bg-muted" />
        <div className="h-48 rounded-2xl bg-muted" />
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
