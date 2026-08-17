import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Perintis — Toolkit Karir Bertenaga AI",
  description:
    "Optimasi resume, cek kompatibilitas ATS, dan persiapan wawancara untuk pencari kerja Indonesia — dengan reasoning AI yang transparan dan bisa diaudit.",
};

const features = [
  {
    title: "Resume Optimizer",
    description:
      "Bandingkan resume Anda dengan lowongan target, dapat skor per kriteria beserta alasannya.",
  },
  {
    title: "ATS Compatibility Check",
    description:
      "Cek struktur resume terhadap sistem ATS sebelum manusia sempat membacanya.",
  },
  {
    title: "Mock Interview",
    description:
      "Simulasi wawancara adaptif untuk gaya startup, korporat, maupun BUMN.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
          Setiap karir besar,
          <br />
          dimulai dari langkah pertama.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          Perintis membantu pencari kerja Indonesia mengoptimalkan resume,
          memahami ATS, dan mempersiapkan wawancara — dengan reasoning AI
          yang transparan, bukan skor tanpa penjelasan.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" render={<Link href="/register">Mulai Sekarang</Link>} />
          <Button
            size="lg"
            variant="outline"
            render={<Link href="/login">Masuk</Link>}
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-8 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-card p-8 transition-transform hover:scale-[1.02]"
            >
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-3 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
