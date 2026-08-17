import { ModuleCard } from "@/components/shared/module-card";

const modules = [
  { title: "Resume Optimizer", description: "Optimasi resume terhadap lowongan target." },
  { title: "ATS Compatibility Check", description: "Cek struktur resume terhadap sistem ATS." },
  { title: "Resume Builder", description: "Susun resume baru dari profil Anda." },
  { title: "Mock Interview", description: "Simulasi wawancara adaptif." },
  { title: "Cover Letter", description: "Buat cover letter dari profil dan lowongan." },
  { title: "Application Tracker", description: "Lacak status lamaran Anda." },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-muted-foreground">
        Modul-modul di bawah akan aktif secara bertahap.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.title} {...module} />
        ))}
      </div>
    </div>
  );
}
