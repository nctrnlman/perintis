import { Link } from "@/i18n/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-10 block text-center text-xl font-semibold tracking-tight"
        >
          Perintis
        </Link>
        {children}
      </div>
    </div>
  );
}
