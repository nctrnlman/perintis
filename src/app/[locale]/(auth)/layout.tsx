import { Link } from "@/i18n/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 flex items-center justify-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
            P
          </span>
          <span>
            <span className="block text-sm leading-tight font-semibold">Perintis</span>
            <span className="block text-xs leading-tight text-muted-foreground">
              by Rhazes Labs
            </span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
