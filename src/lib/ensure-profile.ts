import { db } from "@/lib/db";

export async function ensureProfileRecord(userId: string) {
  return db.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}
