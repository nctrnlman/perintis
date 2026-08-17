import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { ensureUserRecord } from "@/lib/ensure-user";
import { AppShell } from "@/components/layout/app-shell";

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
    <AppShell userEmail={user!.email ?? ""} userName={profile?.fullName ?? null}>
      {children}
    </AppShell>
  );
}
