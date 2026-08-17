import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ensureUserRecord } from "@/lib/ensure-user";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
  }

  await ensureUserRecord(user!);
  const profile = await db.profile.findUnique({ where: { userId: user!.id } });

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userEmail={user!.email ?? ""} userName={profile?.fullName ?? null} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
