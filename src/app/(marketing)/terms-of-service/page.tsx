import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat Layanan",
  description: "Syarat layanan Perintis oleh Devino Labs.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Syarat Layanan</h1>
      <p className="mt-6 text-muted-foreground">
        Halaman ini akan diperbarui dengan syarat layanan lengkap Perintis
        sebelum peluncuran publik.
      </p>
    </div>
  );
}
