import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 - Halaman tidak ditemukan | Perintis",
  description: "Halaman yang Anda cari mungkin sudah dipindahkan atau memang tidak pernah ada.",
};

export default function GlobalNotFound() {
  return (
    <html lang="id" className={`${inter.className} h-full antialiased`}>
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-6 py-32 text-center text-foreground">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
            P
          </span>
          <span>
            <span className="block text-sm leading-tight font-semibold">Perintis</span>
            <span className="block text-xs leading-tight text-muted-foreground">
              by Rhazes Labs
            </span>
          </span>
        </Link>
        <span className="animate-in fade-in-0 zoom-in-95 mt-10 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground duration-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-7 animate-pulse"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="8" x2="14" y2="14" />
            <line x1="14" y1="8" x2="8" y2="14" />
          </svg>
        </span>
        <h1 className="animate-in fade-in-0 slide-in-from-bottom-2 mt-6 text-3xl font-semibold tracking-tight duration-500 sm:text-4xl">
          Halaman tidak ditemukan
        </h1>
        <p className="animate-in fade-in-0 slide-in-from-bottom-2 mt-3 max-w-md text-muted-foreground delay-75 duration-500">
          Halaman yang Anda cari mungkin sudah dipindahkan atau memang tidak pernah ada.
        </p>
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 flex flex-wrap items-center justify-center gap-3 delay-150 duration-500">
          <Link
            href="/"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Kembali ke beranda
          </Link>
          <Link
            href="/features"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Lihat semua fitur
          </Link>
        </div>
        <div className="animate-in fade-in-0 mt-10 border-t border-border pt-6 delay-200 duration-500">
          <p className="text-xs font-medium text-muted-foreground">
            Atau langsung coba salah satu fitur ini
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/features/ats-check"
              className="rounded-full border border-border px-3.5 py-1.5 text-sm hover:bg-muted"
            >
              Cek ATS
            </Link>
            <Link
              href="/features/resume-builder"
              className="rounded-full border border-border px-3.5 py-1.5 text-sm hover:bg-muted"
            >
              Resume Builder
            </Link>
            <Link
              href="/features/application-tracker"
              className="rounded-full border border-border px-3.5 py-1.5 text-sm hover:bg-muted"
            >
              Application Tracker
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
