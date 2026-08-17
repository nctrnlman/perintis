import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, MessagesSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Perintis — Toolkit Karir Bertenaga AI",
  description:
    "Optimasi resume, cek kompatibilitas ATS, dan persiapan wawancara untuk pencari kerja Indonesia — dengan reasoning AI yang transparan dan bisa diaudit.",
};

const features = [
  {
    icon: FileCheck2,
    title: "Resume Optimizer",
    description:
      "Skor kecocokan resume terhadap lowongan — lengkap dengan alasannya, bukan cuma angka.",
  },
  {
    icon: ShieldCheck,
    title: "ATS Compatibility Check",
    description: "Lolos sistem ATS sebelum sampai ke manusia.",
  },
  {
    icon: MessagesSquare,
    title: "Mock Interview",
    description: "Latihan wawancara adaptif, gaya startup sampai BUMN.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center">
        <Reveal>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Setiap karir besar,
            <br />
            dimulai dari langkah pertama.
          </h1>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Resume yang lolos ATS. Wawancara yang siap. Satu tempat, dipandu
            AI yang transparan.
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-10 flex gap-4">
            <Button
              size="lg"
              render={<Link href="/register">Mulai Sekarang</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/login">Masuk</Link>}
            />
          </div>
        </Reveal>
      </section>

      <section className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {features.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 100}>
                <div className="h-full rounded-2xl bg-background p-8 transition-transform hover:scale-[1.02]">
                  <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-24">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
            Langkah pertama Anda dimulai hari ini.
          </h2>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8"
            render={<Link href="/register">Buat Akun Gratis</Link>}
          />
        </Reveal>
      </section>
    </>
  );
}
