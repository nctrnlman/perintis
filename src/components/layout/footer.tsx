import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Devino Labs. Perintis.</p>
        <div className="flex gap-6">
          <Link href="/privacy-policy" className="hover:text-foreground">
            Kebijakan Privasi
          </Link>
          <Link href="/terms-of-service" className="hover:text-foreground">
            Syarat Layanan
          </Link>
        </div>
      </div>
    </footer>
  );
}
