import { db } from "@/lib/db";

interface AuthUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

export async function ensureUserRecord(user: AuthUser) {
  const name =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null;

  await db.user.upsert({
    where: { id: user.id },
    update: { email: user.email ?? "" },
    create: {
      id: user.id,
      email: user.email ?? "",
      name,
    },
  });
}
