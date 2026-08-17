import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Kebijakan privasi Perintis oleh Devino Labs.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Kebijakan Privasi</h1>
      <p className="mt-6 text-muted-foreground">
        Halaman ini akan diperbarui dengan kebijakan privasi lengkap Perintis
        sebelum peluncuran publik. Devino Labs berkomitmen menjaga
        kerahasiaan data resume, riwayat lamaran, dan informasi pribadi
        pengguna.
      </p>
    </div>
  );
}
