# Design Spec — Perintis Phase 1: Foundation

**Date**: 2026-08-17
**Status**: Approved for planning
**Source PRD**: `prd-perintis-by-devino-labs.md` (root of this repo)

## 1. Scope

This spec covers **Phase 1 — Foundation** only, per the PRD's Build Roadmap (§9):

1. Project setup (Next.js, Tailwind, Prisma, Supabase connection via env vars)
2. Design system components (design tokens as Tailwind config + shadcn theme)
3. Home page (static marketing page)
4. Auth flow (register, login, forgot password — email/password now, Google OAuth scaffolded but disabled)
5. Dashboard skeleton (authenticated shell, empty state, nav)

Everything else in the PRD (Optimizer, ATS Check, Builder, Interview, Tracker, Company Intel, LinkedIn, Skill Development, Documents) is explicitly **out of scope** for this phase and will each get their own spec → plan → implementation cycle later, per the PRD's own phasing (Phases 2–5).

The Next.js project is generated directly in this repo's root directory (`/Users/rhazes/Local/Rhazes/Work/Personal/perintis`) — not a nested subfolder.

## 2. Stack

Per PRD §7, no deviation except one resolved inconsistency (see §3):

- Next.js 14+, App Router, TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL via Supabase, Prisma ORM
- Supabase Auth (`@supabase/ssr`) for email/password auth
- Hosting: Vercel (deploy deferred until user is ready — not part of this phase's done-criteria)

LLM orchestration (Vercel AI SDK, Gemini), file parsing, rate limiting (Upstash) are **not** included in Phase 1 — they belong to Phase 2 onward where AI features actually start.

## 3. Resolved inconsistency: Auth implementation

PRD §7 states Auth = Supabase Auth. PRD §8's folder structure lists `app/api/auth/[...nextauth]/route.ts`, which is a NextAuth.js convention, not Supabase Auth.

**Resolution**: use Supabase Auth directly via `@supabase/ssr` (server + browser clients, middleware-based session refresh). No NextAuth route is created. This keeps a single auth system, integrated with the same Supabase project as the database — matching the PRD's own stated rationale.

## 4. Design system

Implement PRD §2 tokens as:

- Tailwind theme extension (`tailwind.config.ts`) for colors, spacing scale (8/16/24/32/48/64/96/128), radius (card 16–24px, button 12px/full)
- CSS variables in `globals.css` for `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--accent`, switched via `.dark` class (Tailwind `darkMode: 'class'`)
- Accent color: `#4F46E5` (indigo) — chosen for contrast in both themes and a professional, non-generic feel
- Font: system stack with Inter fallback, weights 400–700
- Motion: scroll-triggered fade/slide-in and hover scale (max 1.02x) via Tailwind + `framer-motion` (lightweight use, no bouncy easing)

Base shadcn/ui components installed as needed (Button, Input, Card, Label, Form) — not the full shadcn catalog upfront.

## 5. Data model (Phase 1 only)

Only two Prisma models now, matching PRD §4 definitions exactly for these two:

```prisma
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

Note: Supabase Auth manages its own `auth.users` table separately. The Prisma `User` model here is the app-level profile row, keyed by the Supabase Auth user id (same `id` value, not a separate signup flow) — created via a trigger-free approach: on first successful auth callback, upsert the `User` row if it doesn't exist.

Other models from PRD §4 (`Resume`, `OptimizerAnalysis`, `ATSCheckAnalysis`, etc.) are added incrementally in their respective phases — not created now (YAGNI, avoids unused migrations).

## 6. Auth flow

- `/register` — email + password, calls `supabase.auth.signUp`, then redirects to `/dashboard` (Supabase email confirmation can be disabled in dashboard settings for this personal-scale project, or left on — user's call, not blocking this phase)
- `/login` — email + password via `supabase.auth.signInWithPassword`
- `/forgot-password` — triggers Supabase password reset email
- Google OAuth button present on `/login` and `/register`, visually styled but `disabled` with a "Segera hadir" (Coming soon) tooltip — avoids rework when Google credentials arrive later
- Session handling via `@supabase/ssr` middleware (`middleware.ts`) refreshing cookies on every request; `(app)` route group protected — unauthenticated access redirects to `/login`

## 7. Pages in scope

- `/` — Home (static marketing, Apple-style hero + a few sections, no real module links yet beyond nav placeholders)
- `/login`, `/register`, `/forgot-password`
- `/dashboard` — authenticated shell: top nav, sidebar or grid of module cards, each of the 11 future modules shown as a "Coming soon" card (no functional links except once built), user menu (logout)
- `/privacy-policy`, `/terms-of-service` — minimal static pages (required by PRD §3 sitemap, cheap to add now)

## 8. Cross-cutting (Phase 1 slice only)

- Responsive, mobile-first layout
- Dark mode from day one (class-based toggle, respects system preference by default)
- Basic SEO: per-page `title`/`description` via Next.js Metadata API on Home; `robots.txt` and `sitemap.xml` stubs
- No GA4 yet — deferred to when there are real funnel events to track (Phase 2+)
- Server-side validation on register/login forms (Zod schemas), never trust client-only validation

## 9. Testing approach

Personal-project scale — lightweight, not full TDD ceremony:

- TypeScript strict mode + ESLint as the primary correctness gate
- Zod schemas unit-tested where validation logic is non-trivial (e.g. password rules)
- Manual smoke test of register → login → dashboard → logout flow via browser before calling Phase 1 done

## 10. Environment & git

- `git init` in this directory, initial `.gitignore` (Next.js default + `.env*.local`)
- `.env.local.example` committed with variable names only, no values:
  ```
  POSTGRES_PRISMA_URL=
  POSTGRES_URL_NON_POOLING=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
  (Gemini/Upstash/GA vars deferred to later phases' `.env.local.example` additions)
- Real `.env.local` filled in by the user after scaffold is in place — Supabase project already exists per user
- First commit made once the scaffold builds and lints clean

## 11. Out of scope for Phase 1 (explicit)

- Any of the 11 AI modules (Optimizer, ATS Check, Builder, Interview, etc.)
- Google OAuth actually working (UI only, disabled)
- Vercel deployment
- GA4 / analytics events
- Rate limiting (Upstash) — irrelevant until AI endpoints exist
- Automated test suite / CI pipeline
