import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  FileCheck2,
  FileEdit,
  Languages,
  Mail,
  ListChecks,
  MessagesSquare,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";

export const metadata: Metadata = {
  title: "Perintis: Toolkit Karir Bertenaga AI",
  description:
    "Optimasi resume, cek kompatibilitas ATS, dan persiapan wawancara untuk pencari kerja Indonesia. Reasoning AI yang transparan dan bisa diaudit, bukan skor buta.",
};

const reasons = [
  {
    icon: SearchCheck,
    title: "Transparan",
    description:
      "Setiap skor disertai alasan yang bisa Anda telusuri sendiri, bukan angka yang jatuh dari langit.",
  },
  {
    icon: Languages,
    title: "Kontekstual",
    description:
      "Bilingual, dan paham budaya wawancara startup, korporat, sampai BUMN.",
  },
  {
    icon: BadgeCheck,
    title: "Jujur",
    description:
      "Perintis tidak pernah menambah pencapaian yang tidak ada di resume Anda. Data kurang, kami tandai, bukan ditebak.",
  },
];

const coreFeatures = [
  {
    icon: FileCheck2,
    title: "Resume Optimizer",
    description:
      "Skor kecocokan resume terhadap lowongan, lengkap dengan alasannya. Bukan cuma angka.",
  },
  {
    icon: ShieldCheck,
    title: "ATS Compatibility Check",
    description: "Lolos sistem ATS sebelum sampai ke manusia.",
  },
  {
    icon: FileEdit,
    title: "Resume Builder",
    description:
      "Susun resume baru dari profil Anda, langsung dalam format yang ramah ATS.",
  },
  {
    icon: MessagesSquare,
    title: "Mock Interview",
    description: "Latihan wawancara adaptif, gaya startup sampai BUMN.",
  },
  {
    icon: Mail,
    title: "Cover Letter",
    description:
      "Cover letter yang pas nada bicaranya, dari formal sampai santai ala startup.",
  },
  {
    icon: ListChecks,
    title: "Application Tracker",
    description:
      "Pantau setiap lamaran dari apply sampai offer, di satu papan yang rapi.",
  },
];

const upcomingModules = [
  "Interview Prep",
  "Company & Market Intel",
  "LinkedIn Optimizer",
  "Skill Development",
  "Dokumen Pendukung",
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
              nativeButton={false}
              render={<Link href="/register">Mulai Sekarang</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/login">Masuk</Link>}
            />
          </div>
        </Reveal>
      </section>

      <section className="bg-card py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Kenapa Perintis
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Transparan. Kontekstual. Jujur.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {reasons.map((reason, index) => (
              <Reveal key={reason.title} delay={index * 100}>
                <div className="h-full rounded-2xl border border-border p-8">
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                    <reason.icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">
                    {reason.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {reason.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Toolkit inti
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Dari resume sampai hari pertama kerja.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Enam modul inti menemani seluruh perjalanan pencarian kerja
              Anda.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 80}>
                <div className="h-full rounded-2xl border border-border p-8 transition-transform hover:scale-[1.02]">
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                    <feature.icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-16 border-t border-border pt-10 text-center">
            <p className="text-sm text-muted-foreground">
              Dan akan terus bertambah:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {upcomingModules.map((module) => (
                <span
                  key={module}
                  className="rounded-full bg-muted px-3.5 py-1.5 text-sm text-muted-foreground"
                >
                  {module}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-muted py-24">
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Langkah pertama Anda dimulai hari ini.
          </h2>
          <Button
            size="lg"
            className="mt-8"
            nativeButton={false}
            render={<Link href="/register">Buat Akun Gratis</Link>}
          />
        </Reveal>
      </section>
    </>
  );
}
