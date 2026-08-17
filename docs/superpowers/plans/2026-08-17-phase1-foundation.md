# Perintis Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Perintis Next.js application in this repo root and ship a working, deployable foundation: design system, Supabase email/password auth, static Home page, and a protected dashboard skeleton with placeholder module cards.

**Architecture:** Next.js 14+ App Router with route groups — `(marketing)` for public pages, `(auth)` for login/register/forgot-password, `(app)` for the authenticated dashboard shell protected via Supabase session check in its layout. Supabase Auth (`@supabase/ssr`) handles sessions; Prisma (User + Profile only) is the app-level data layer, connected to the same Supabase Postgres instance.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Supabase (Auth + Postgres via `@supabase/ssr`), Zod, react-hook-form, next-themes, Vitest (for validation-logic unit tests only).

**Spec:** `docs/superpowers/specs/2026-08-17-phase1-foundation-design.md`

## Global Constraints

- Next.js project is generated directly in this repo root (`/Users/rhazes/Local/Rhazes/Work/Personal/perintis`), not a nested subfolder.
- Auth is Supabase Auth via `@supabase/ssr` only — no NextAuth, no `app/api/auth/[...nextauth]` route.
- Data model this phase: only Prisma `User` and `Profile` models. No other PRD models yet.
- Google OAuth is UI-only (visible, disabled button, "Segera hadir" label) — not wired up this phase.
- No LLM integration, no GA4, no Upstash rate limiting, no Vercel deploy — out of scope this phase.
- Accent color: `#4F46E5` light / `#6366F1`-equivalent (HSL `243 82% 66%`) dark, computed as HSL `243 75% 59%` (light) for use in the shadcn CSS-variable theme system.
- Dark mode via `.dark` class (next-themes, `attribute="class"`), default `system`.
- All env secrets live in a single `.env` file (Prisma's native default, also auto-loaded by Next.js) — never `.env.local` for this project, to avoid Prisma CLI/Next.js reading from two different files. `.env` must be confirmed gitignored before first commit that touches it.
- TypeScript strict mode + ESLint clean is the correctness gate for every task; no automated UI test suite, per the spec's lightweight testing approach — only Zod validation logic gets unit tests (Vitest).
- Server-side Zod validation on every auth form; never trust client-only validation.
- Git commits in this repo must NOT include any Claude/AI co-author attribution or byline — plain, human-style commit messages only.

## File Structure

```
perintis/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── privacy-policy/page.tsx
│   │   │   └── terms-of-service/page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   └── dashboard/page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── ui/                    → shadcn-generated (button, input, label, card, form)
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── dashboard-nav.tsx
│   │   └── shared/
│   │       ├── theme-provider.tsx
│   │       ├── theme-toggle.tsx
│   │       └── module-card.tsx
│   ├── lib/
│   │   ├── db.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   └── validations/
│   │       ├── auth.ts
│   │       └── auth.test.ts
│   └── middleware.ts
├── prisma/
│   └── schema.prisma
├── .env                            → gitignored, real values
├── .env.example                    → committed, empty values
└── tailwind.config.ts
```

---

### Task 1: Scaffold the Next.js project

**Files:**
- Create: entire Next.js scaffold at repo root (`package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `public/`, `.gitignore`, `eslint.config.*`)

**Interfaces:**
- Produces: a buildable Next.js + TypeScript + Tailwind + ESLint project at repo root, App Router with `src/` dir, import alias `@/*`.

- [ ] **Step 1: Scaffold into a temp directory (repo root already has `.git`, `docs/`, and the PRD file, so `create-next-app` can't target it directly)**

```bash
cd /Users/rhazes/Local/Rhazes/Work/Personal/perintis
npx --yes create-next-app@latest perintis-scaffold-tmp \
  --typescript --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm
```
If prompted about Turbopack or any other option not covered by the flags above, accept the default.

- [ ] **Step 2: Move generated files into the repo root, drop the nested `.git`**

```bash
rm -rf perintis-scaffold-tmp/.git
shopt -s dotglob nullglob
mv perintis-scaffold-tmp/* .
shopt -u dotglob nullglob
rmdir perintis-scaffold-tmp
```

- [ ] **Step 3: Confirm the default `.gitignore` covers all env file variants**

Open `.gitignore` and confirm it contains a line matching `.env*` (create-next-app's default template includes this). If it only has `.env*.local`, add a line `.env` explicitly before proceeding to any task that creates real secrets.

- [ ] **Step 4: Verify the scaffold builds**

Run: `npm run build`
Expected: build succeeds against the default Next.js starter page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 App Router project"
```

---

### Task 2: Design system — shadcn/ui, tokens, dark mode

**Files:**
- Create: `src/components/shared/theme-provider.tsx`, `src/components/shared/theme-toggle.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: shadcn CLI-generated `src/components/ui/button.tsx` (installed this task).
- Produces: `ThemeProvider` (component, wraps `children`, passes through `next-themes` props), `ThemeToggle` (component, no props) — both imported by Task 5 (root layout) and Task 9 (dashboard nav).

- [ ] **Step 1: Initialize shadcn/ui**

```bash
npx --yes shadcn@latest init --yes --base-color neutral
```
If prompted interactively instead, choose: TypeScript yes, style "New York", base color "Neutral", CSS variables "yes".

- [ ] **Step 2: Add the base components this phase needs**

```bash
npx --yes shadcn@latest add button input label card form
```
This also adds `react-hook-form`, `@hookform/resolvers`, `lucide-react`, and Radix primitives as dependencies automatically.

- [ ] **Step 3: Replace the generated color tokens in `src/app/globals.css` with the PRD-derived values**

Replace the `@layer base { :root { ... } .dark { ... } }` block (keep the `@tailwind` directives and the second `@layer base` block with `* { @apply border-border; }` as generated) with:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 3% 12%;
    --card: 240 11% 97%;
    --card-foreground: 240 3% 12%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 3% 12%;
    --primary: 243 75% 59%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 11% 97%;
    --secondary-foreground: 240 3% 12%;
    --muted: 240 11% 97%;
    --muted-foreground: 240 2% 44%;
    --accent: 240 11% 97%;
    --accent-foreground: 240 3% 12%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 6% 90%;
    --input: 240 6% 90%;
    --ring: 243 75% 59%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 0 0% 4%;
    --foreground: 240 11% 97%;
    --card: 240 3% 12%;
    --card-foreground: 240 11% 97%;
    --popover: 0 0% 4%;
    --popover-foreground: 240 11% 97%;
    --primary: 243 82% 66%;
    --primary-foreground: 0 0% 100%;
    --secondary: 240 3% 12%;
    --secondary-foreground: 240 11% 97%;
    --muted: 240 3% 12%;
    --muted-foreground: 240 2% 60%;
    --accent: 240 3% 16%;
    --accent-foreground: 240 11% 97%;
    --destructive: 0 70% 50%;
    --destructive-foreground: 0 0% 100%;
    --border: 240 3% 18%;
    --input: 240 3% 18%;
    --ring: 243 82% 66%;
  }
}
```

Note: `--radius: 0.75rem` (12px) matches the PRD's button radius. Cards use `rounded-2xl` (16px) directly in markup, not the shared `--radius` var, matching the PRD's differentiated card/button radius.

- [ ] **Step 4: Install next-themes and add the theme provider/toggle**

```bash
npm install next-themes
```

`src/components/shared/theme-provider.tsx`:
```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

`src/components/shared/theme-toggle.tsx`:
```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: design system tokens, shadcn/ui base components, dark mode"
```

---

### Task 3: Prisma schema and Supabase env wiring

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `.env`, `.env.example`

**Interfaces:**
- Produces: `db` (named export from `src/lib/db.ts`, a `PrismaClient` singleton) — consumed by any future server-side data access (not used yet in this phase's pages, but required to exist per spec §5).

- [ ] **Step 1: Install dependencies**

```bash
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr zod
```

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 3: Replace `prisma/schema.prisma` contents**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  oauthProvider String?
  createdAt     DateTime @default(now())

  profile Profile?
}

model Profile {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  targetRole       String?
  targetIndustry   String?
  experienceBlocks Json
  updatedAt        DateTime @updatedAt
}
```

- [ ] **Step 4: Set up `.env` and `.env.example`**

Replace the auto-generated `.env` (from `prisma init`) with:
```dotenv
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Create `.env.example` with the same content (this one gets committed — confirm `.env` itself is gitignored per Task 1 Step 3 before staging).

- [ ] **Step 5: Validate the schema (no live DB needed)**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 6: Create the Prisma client singleton**

`src/lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: succeeds (Prisma client generates against the schema even without a live DB connection).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Prisma schema (User, Profile) and Supabase env scaffolding"
```

> Note: `npx prisma migrate dev --name init` cannot run until real Supabase credentials are filled into `.env` — this is a manual follow-up after this plan, not a task here.

---

### Task 4: Supabase Auth clients and session middleware

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env` (Task 3).
- Produces: `createClient(): SupabaseClient` (browser, from `@/lib/supabase/client`, sync); `createClient(): Promise<SupabaseClient>` (server, from `@/lib/supabase/server`, async) — both consumed by Tasks 7, 8, 9.

- [ ] **Step 1: Browser client**

`src/lib/supabase/client.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Server client**

`src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware refreshes
            // the session on the next request instead.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Middleware session-refresh helper**

`src/lib/supabase/middleware.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
```

- [ ] **Step 4: Wire up `src/middleware.ts`**

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: succeeds (these are function definitions, not executed at build time).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Supabase Auth browser/server clients and session middleware"
```

---

### Task 5: Root layout, fonts, theme wiring

**Files:**
- Modify: `src/app/layout.tsx`, `tailwind.config.ts`

**Interfaces:**
- Consumes: `ThemeProvider` (Task 2).
- Produces: root `<html>`/`<body>` shell and default `Metadata` consumed by every page.

- [ ] **Step 1: Add the Inter variable font to `tailwind.config.ts`**

In the `theme.extend` object, add:
```ts
fontFamily: {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
},
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Perintis — Setiap karir besar, dimulai dari langkah pertama",
    template: "%s | Perintis",
  },
  description:
    "Perintis adalah toolkit karir berbasis AI untuk pencari kerja Indonesia: optimasi resume, cek kompatibilitas ATS, simulasi wawancara, dan pelacakan lamaran — dengan reasoning AI yang transparan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build and visually confirm theme + font**

Run: `npm run build`, then `npm run dev` and open `http://localhost:3000` — confirm the Inter font is applied and toggling OS dark mode changes the background.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: root layout with font loading and theme provider"
```

---

### Task 6: Home page, navbar, footer, SEO routes

**Files:**
- Create: `src/components/layout/navbar.tsx`, `src/components/layout/footer.tsx`, `src/app/(marketing)/layout.tsx`, `src/app/(marketing)/page.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`
- Modify: `src/app/page.tsx` (delete — replaced by the route-group version), `src/app/globals.css` (no change needed here)

**Interfaces:**
- Produces: `Navbar`, `Footer` (components, no props) — reused by Task 10.

- [ ] **Step 1: Delete the default scaffold home page (it's superseded by the route-group version)**

```bash
rm src/app/page.tsx
```

- [ ] **Step 2: Navbar**

`src/components/layout/navbar.tsx`:
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Perintis
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Daftar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Footer**

`src/components/layout/footer.tsx`:
```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Devino Labs. Perintis.</p>
        <div className="flex gap-6">
          <Link href="/privacy-policy" className="hover:text-foreground">
            Kebijakan Privasi
          </Link>
          <Link href="/terms-of-service" className="hover:text-foreground">
            Syarat Layanan
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Marketing layout**

`src/app/(marketing)/layout.tsx`:
```tsx
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Home page**

`src/app/(marketing)/page.tsx`:
```tsx
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
          <Button size="lg" asChild>
            <Link href="/register">Mulai Sekarang</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Masuk</Link>
          </Button>
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
```

- [ ] **Step 6: SEO routes**

`src/app/robots.ts`:
```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard"],
    },
    sitemap: "https://perintis.devino.id/sitemap.xml",
  };
}
```

`src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://perintis.devino.id";
  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/privacy-policy`, lastModified: new Date() },
    { url: `${base}/terms-of-service`, lastModified: new Date() },
  ];
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build`
Expected: succeeds; `/`, `/robots.txt`, `/sitemap.xml` all render.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: home page, marketing layout, SEO routes"
```

---

### Task 7: Auth validation schemas and Register page

**Files:**
- Create: `src/lib/validations/auth.ts`, `src/lib/validations/auth.test.ts`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `createClient` (browser, Task 4).
- Produces: `registerSchema`, `loginSchema`, `forgotPasswordSchema` (Zod objects) and `RegisterInput`, `LoginInput`, `ForgotPasswordInput` (inferred types) from `@/lib/validations/auth` — consumed by Task 8.

- [ ] **Step 1: Install the test runner**

```bash
npm install -D vitest
```
Add to `package.json` `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing test**

`src/lib/validations/auth.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("registerSchema", () => {
  it("rejects a password without an uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "lowercase1",
      confirmPassword: "lowercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirmPassword", () => {
    const result = registerSchema.safeParse({
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "Password1",
      confirmPassword: "Password2",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      name: "Budi Santoso",
      email: "budi@example.com",
      password: "Password1",
      confirmPassword: "Password1",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test, confirm it fails**

Run: `npx vitest run src/lib/validations/auth.test.ts`
Expected: FAIL — `./auth` module not found.

- [ ] **Step 4: Implement the schemas**

`src/lib/validations/auth.ts`:
```ts
import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung huruf besar")
      .regex(/[0-9]/, "Password harus mengandung angka"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
```

- [ ] **Step 5: Run the test, confirm it passes**

Run: `npx vitest run src/lib/validations/auth.test.ts`
Expected: PASS (4/4).

- [ ] **Step 6: Auth layout**

`src/app/(auth)/layout.tsx`:
```tsx
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-lg font-semibold tracking-tight"
        >
          Perintis
        </Link>
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Register page**

If `react-hook-form` and `@hookform/resolvers` were not already added by `shadcn add form` in Task 2, install them now: `npm install react-hook-form @hookform/resolvers`.

`src/app/(auth)/register/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name } },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold">Buat akun Perintis</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mulai optimasi resume dan persiapan karir Anda.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Budi Santoso" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konfirmasi Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Membuat akun..." : "Daftar"}
          </Button>

          <Button type="button" variant="outline" className="w-full" disabled>
            Daftar dengan Google (Segera hadir)
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: auth validation schemas (Vitest-tested) and register page"
```

---

### Task 8: Login and Forgot-password pages

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`

**Interfaces:**
- Consumes: `createClient` (browser, Task 4), `loginSchema`/`LoginInput`, `forgotPasswordSchema`/`ForgotPasswordInput` (Task 7).

- [ ] **Step 1: Login page**

`src/app/(auth)/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold">Masuk ke Perintis</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Lupa password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Memproses..." : "Masuk"}
          </Button>

          <Button type="button" variant="outline" className="w-full" disabled>
            Masuk dengan Google (Segera hadir)
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Forgot-password page**

`src/app/(auth)/forgot-password/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-semibold">Cek email Anda</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kami sudah mengirim tautan untuk reset password.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Masukkan email Anda, kami akan kirim tautan reset password.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Mengirim..." : "Kirim tautan reset"}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: login and forgot-password pages"
```

---

### Task 9: Dashboard skeleton (protected)

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/dashboard/page.tsx`, `src/components/layout/dashboard-nav.tsx`, `src/components/shared/module-card.tsx`

**Interfaces:**
- Consumes: `createClient` (server, Task 4), `createClient` (browser, Task 4), `ThemeToggle` (Task 2).
- Produces: `ModuleCard` (component, props `{ title: string; description: string; comingSoon?: boolean }`) — reusable when real modules replace the placeholders in later phases.

- [ ] **Step 1: Protected app layout**

`src/app/(app)/layout.tsx`:
```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/layout/dashboard-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav userEmail={user.email ?? ""} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Dashboard nav**

`src/components/layout/dashboard-nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { createClient } from "@/lib/supabase/client";

export function DashboardNav({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          Perintis
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{userEmail}</span>
          <ThemeToggle />
          <Button variant="ghost" onClick={handleLogout}>
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Module placeholder card**

`src/components/shared/module-card.tsx`:
```tsx
interface ModuleCardProps {
  title: string;
  description: string;
  comingSoon?: boolean;
}

export function ModuleCard({
  title,
  description,
  comingSoon = true,
}: ModuleCardProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6">
      {comingSoon && (
        <span className="absolute right-4 top-4 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          Segera hadir
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
```

- [ ] **Step 4: Dashboard page**

`src/app/(app)/dashboard/page.tsx`:
```tsx
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
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: protected dashboard skeleton with placeholder module cards"
```

---

### Task 10: Legal pages

**Files:**
- Create: `src/app/(marketing)/privacy-policy/page.tsx`, `src/app/(marketing)/terms-of-service/page.tsx`

- [ ] **Step 1: Privacy policy page**

`src/app/(marketing)/privacy-policy/page.tsx`:
```tsx
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
```

- [ ] **Step 2: Terms of service page**

`src/app/(marketing)/terms-of-service/page.tsx`:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat Layanan",
  description: "Syarat layanan Perintis oleh Devino Labs.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-semibold">Syarat Layanan</h1>
      <p className="mt-6 text-muted-foreground">
        Halaman ini akan diperbarui dengan syarat layanan lengkap Perintis
        sebelum peluncuran publik.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: privacy policy and terms of service pages"
```

---

### Task 11: Final verification and QA pass

**Files:** none (verification only)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Full build**

Run: `npm run build`
Expected: succeeds, all routes listed (`/`, `/login`, `/register`, `/forgot-password`, `/dashboard`, `/privacy-policy`, `/terms-of-service`, `/robots.txt`, `/sitemap.xml`).

- [ ] **Step 3: Unit tests**

Run: `npm run test`
Expected: PASS (auth validation suite from Task 7).

- [ ] **Step 4: Manual browser smoke test**

Run: `npm run dev`, then in a browser check:
- Home page renders, hero + feature cards visible, nav links work
- Toggle dark mode via the navbar theme toggle — background/text/card colors switch correctly
- `/register` and `/login` forms show validation errors on bad input (e.g. short password, invalid email)
- Visiting `/dashboard` while logged out redirects to `/login`
- Resize to mobile width (375px) — no horizontal overflow, nav and hero remain usable
- Note: actual sign-up/login against Supabase will only work once real values are filled into `.env` — this is expected and not a Phase 1 blocker.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 foundation complete"
```

---

## Manual follow-ups (outside this plan, blocked on user-provided credentials)

- Fill real values into `.env` (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) from the existing Supabase project.
- Run `npx prisma migrate dev --name init` once `.env` has real DB credentials.
- Re-run the manual smoke test with real credentials to confirm sign-up/login/logout actually persist a session.
