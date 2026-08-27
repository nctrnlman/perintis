# Perintis

**AI-powered career toolkit for job seekers in Indonesia.** Build a career profile once, then turn it into an ATS-safe resume, a tailored cover letter, a skills-based role match, and a tracked history of every application, all in one place.

Built by Rhazes Labs.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-proprietary-lightgrey)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Database](#database)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Design Principles](#design-principles)
- [License](#license)

## Overview

Most job seekers rewrite the same career information over and over across resumes, cover letters, and application forms, with no way to know whether their resume can even be read correctly by the Applicant Tracking Systems (ATS) that filter candidates before a human ever sees them. Perintis centralizes that data once and reuses it across every stage of the job search.

The product is bilingual (Bahasa Indonesia by default, English as a full alternative locale) and free to use, with no paid tier.

## Features

| Module | Description |
|---|---|
| **Profile** | Single source of truth for career data (work experience, education, skills, certifications, projects, languages). Auto-saves as you type, with optional AI-assisted CV import (PDF/DOCX). |
| **ATS Compatibility Check** | Uploads a resume and scores structural ATS-parseability (rule-based) separately from AI-driven keyword extraction and optional job-posting match analysis. |
| **Resume Builder** | Builds an ATS-safe, single-column PDF resume from a Profile snapshot, with AI-assisted bullet-point rewriting and a live PDF preview while editing. |
| **Cover Letter** | Generates a complete cover letter from Profile data plus a target company/position/job posting, with tone and length controls. Exports to PDF and DOCX. |
| **Application Tracker** | Kanban board for tracking every application through seven stages, with an interview-round timeline per application. |
| **Career Fit** | Matches Profile skills against a curated role taxonomy using a deterministic scoring algorithm; AI only explains a match, it never chooses which roles appear. |

See `dev/PRODUCT.md` (local reference, not version-controlled) for a full feature breakdown, design principles, and product rationale.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack), React 19, TypeScript (strict) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first config) |
| UI primitives | [shadcn](https://ui.shadcn.com) on [Base UI](https://base-ui.com) |
| Database | PostgreSQL via [Prisma 6](https://www.prisma.io), hosted on [Supabase](https://supabase.com) |
| Auth | [Supabase Auth](https://supabase.com/docs/guides/auth) (`@supabase/ssr`) |
| i18n | [next-intl](https://next-intl.dev) (`id` default, `en` optional) |
| Forms/validation | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| Rich text | [Tiptap](https://tiptap.dev) |
| Document export | [`@react-pdf/renderer`](https://react-pdf.org), [`docx`](https://docx.js.org) |
| Resume parsing | `pdfjs-dist`, `mammoth` + `jszip` |
| AI | [Google Gemini](https://ai.google.dev) via `@google/genai`, free tier only |
| Testing | [Vitest](https://vitest.dev) |

## Prerequisites

- Node.js 20 or later
- A [Supabase](https://supabase.com) project (Postgres database + Auth)
- A [Google Gemini API key](https://ai.google.dev)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# then fill in .env — see Environment Variables below

# 3. Apply database migrations (also generates the Prisma Client)
npx prisma migrate dev

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. It redirects to the Bahasa Indonesia locale by default.

## Environment Variables

All variables are declared (without values) in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_PRISMA_URL` | Yes | Pooled Postgres connection string (Supabase), used by Prisma at runtime. |
| `POSTGRES_URL_NON_POOLING` | Yes | Direct (non-pooled) Postgres connection string, used by Prisma for migrations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key (server-side only, never exposed to the client). |
| `ID_ENCRYPTION_KEY` | Yes | Symmetric key used to encrypt database IDs before they appear in URLs. |
| `GEMINI_API_KEY` | Yes | Google Gemini API key, powers every AI feature. |
| `SITE_URL` | No | Canonical production URL (e.g. `https://perintis.vercel.app`), used for SEO metadata, the sitemap, robots.txt, and the RSS feed. Defaults to `http://localhost:3000` if unset. |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics measurement ID. |
| `GOOGLE_SITE_VERIFICATION` | No | Google Search Console verification token. |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the development server (Turbopack). |
| `npm run build` | Builds the app for production. |
| `npm run start` | Runs the production build locally. |
| `npm run lint` | Runs ESLint. |
| `npm run test` | Runs the Vitest test suite once. |
| `npx tsc --noEmit` | Type-checks the project without emitting output. |

Before committing, the project convention is to run all four checks: `npx tsc --noEmit`, `npm run lint`, `npm run test`, and `npm run build`.

## Database

Schema lives in `prisma/schema.prisma`. The generated Prisma Client is emitted to `src/generated/prisma` (not the default `node_modules/.prisma/client` location) and should always be imported via `@/lib/db`, never directly.

```bash
# Create and apply a new migration
npx prisma migrate dev --name <migration-name>

# Apply existing migrations without creating a new one (e.g. in CI/production)
npx prisma migrate deploy

# Regenerate the Prisma Client after a schema change without migrating
npx prisma generate
```

Restart the dev server after running any Prisma command, Node does not hot-reload the generated client.

## Testing

The project follows a pure-function TDD convention: only pure functions and Zod schemas get unit tests (matching algorithms, scoring, formatting, validation). Server actions, AI-calling code, and UI components are not covered by automated tests, they're verified manually.

```bash
npm run test
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (app)/          # Authenticated app shell (sidebar + top bar)
│   │   ├── (auth)/         # Login, register, forgot/update password
│   │   └── (marketing)/    # Public landing, feature, and legal pages
│   ├── sitemap.ts, robots.ts, feed.xml/
│   └── proxy.ts            # next-intl routing + Supabase session refresh (Next.js 16's middleware)
├── components/              # UI components, grouped by feature
├── lib/                     # Business logic, validation schemas, integrations
├── generated/prisma/         # Generated Prisma Client (gitignored)
├── hooks/                    # Shared React hooks
└── i18n/                     # next-intl routing and navigation config
messages/                     # id.json / en.json translation bundles
prisma/                       # Schema and migrations
```

> **Note:** This is Next.js 16, not the Next.js most training data reflects. Route conventions, the middleware-to-`proxy.ts` rename, and other APIs may differ from what's generally assumed. See `AGENTS.md` (auto-generated by `next dev`) for framework-specific notes before making routing or middleware changes.

## Internationalization

Every user-facing string goes through [next-intl](https://next-intl.dev) (`messages/id.json` / `messages/en.json`), never hardcoded in components. Bahasa Indonesia is the default locale with no prefix in the URL (`localePrefix: "as-needed"`); English is available at `/en/*`. There is no automatic browser-language redirect, by design.

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com):

1. Set all required [environment variables](#environment-variables) in the Vercel project settings, including `SITE_URL` pointed at the production domain.
2. Run database migrations against the production database before or during deploy: `npx prisma migrate deploy`.
3. Add the deployed domain's redirect URL (e.g. `https://your-domain.com/**`) to Supabase's **Authentication → URL Configuration → Redirect URLs**, and confirm **Site URL** matches production.
4. For anything beyond light testing traffic, configure a custom SMTP provider under Supabase's **Authentication → Emails → SMTP Settings**. The built-in mailer is rate-limited and not intended for production use.

## Design Principles

- **No fabrication.** No feature, AI-generated or otherwise, invents data. Every AI prompt is explicitly instructed to work only from what the user actually provided.
- **Free, always.** No paywalls, no artificial usage caps.
- **Calm, Apple-inspired UI.** Generous whitespace, hairline borders over filled boxes, a single accent color reserved for buttons and real links, no em dashes in user-facing copy.
- **Ownership checks everywhere.** Every server action verifies the requesting user owns the record before reading or mutating it. Database IDs are encrypted before appearing in a URL.

## License

Proprietary. All rights reserved. This is a private project and is not currently licensed for reuse, redistribution, or external contribution.
