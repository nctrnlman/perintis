import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Uses the `pg` driver adapter (JS/WASM query compiler) instead of Prisma's
// native query-engine binary, since that binary reliably fails to make it
// into Vercel's serverless function bundle when the client is generated to
// a custom output path.
//
// `sslmode` and `schema` are stripped from the URL and passed to `pg`
// explicitly: newer `pg` versions treat `sslmode=require` as full chain
// verification, which rejects Supabase's pooler certificate, and `pg` has
// no built-in notion of the `schema` query param Prisma's classic engine
// used to set the connection's search path.
//
// POSTGRES_PRISMA_URL must point at Supabase's Transaction-mode pooler
// (port 6543), not Session mode (port 5432, capped at 15 total clients
// project-wide) — each serverless invocation opens its own `pg.Pool`, and
// a single page's concurrent queries alone can exhaust a session-mode pool.
const url = new URL(process.env.POSTGRES_PRISMA_URL!);
const schema = url.searchParams.get("schema") ?? undefined;
url.searchParams.delete("sslmode");
url.searchParams.delete("schema");
const adapter = new PrismaPg(
  { connectionString: url.toString(), ssl: { rejectUnauthorized: false }, max: 5 },
  { schema }
);

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
