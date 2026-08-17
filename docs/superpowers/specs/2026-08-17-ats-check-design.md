# Design Spec — Perintis Phase 2 (Sub-project 1): Resume Upload + ATS Compatibility Check

**Date**: 2026-08-17
**Status**: Approved for planning
**Source PRD**: `prd-perintis-by-devino-labs.md` §5.2, §4, §9 (Phase 2, item 6)

## 1. Scope

First sub-project of Phase 2 — Core Value. Delivers a complete, working slice: upload a resume, get a structural ATS compatibility report. No LLM involved yet (per PRD §5.2, structural checks are explicitly rule-based/deterministic).

In scope:
- Resume upload (PDF, DOCX), server-side parsing, structural ATS checks
- Shared ID-encryption utility for all future `/module/[id]` detail routes
- `/ats-check`, `/ats-check/new`, `/ats-check/[id]` pages
- Persisting `Resume` and `ATSCheckAnalysis` records

Out of scope for this sub-project (explicit):
- LLM keyword-relevance layer (`keywordFindings` stays `null`) — a follow-up sub-project once Vercel AI SDK + Gemini are wired up
- Resume Optimizer (reuses this upload/parsing infrastructure once built)
- History/Profile pages (Phase 2 item 8) — this sub-project only persists data; a dedicated history view comes later
- Supabase Storage — the original uploaded file is processed in-memory during the request and discarded; only extracted text and findings are persisted, matching the PRD's `Resume` model (which has no file-URL field)
- PDF table detection and PDF header/footer detection — documented technical limitation, see §4

## 2. Shared infrastructure: ID encryption for URLs

Every future `/module/[id]` route (per the PRD's full sitemap) exposes a database record id in the URL. Rather than exposing the raw Prisma `cuid()` directly, ids are encrypted before being placed in a URL and decrypted server-side when a page reads the `[id]` param.

- `src/lib/id-crypto.ts`: `encryptId(id: string): string` and `decryptId(token: string): string | null`
- AES-256-GCM (authenticated encryption — tampered tokens fail decryption, not just "hard to read" obfuscation)
- Key from `ID_ENCRYPTION_KEY` env var (32-byte key, base64-encoded), added to `.env`/`.env.example`
- Token format: `base64url(iv[12 bytes] + authTag[16 bytes] + ciphertext)` — URL-safe, no padding characters that need escaping
- `decryptId` returns `null` (never throws) on a malformed/tampered token — callers respond with `notFound()`, not a raw error
- This utility is written once here and reused by every future detail-page route in the project — not re-implemented per module

## 3. Data model additions

Add to `prisma/schema.prisma`, matching PRD §4 exactly:

```prisma
model Resume {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  filename   String?
  rawText    String
  source     String   // "uploaded" | "built"
  uploadedAt DateTime @default(now())

  atsChecks ATSCheckAnalysis[]
}

model ATSCheckAnalysis {
  id                 String   @id @default(cuid())
  userId             String
  user               User     @relation(fields: [userId], references: [id])
  resumeId           String
  resume             Resume   @relation(fields: [resumeId], references: [id])
  jobPostingText     String?
  overallScore       Int
  structuralFindings Json
  keywordFindings    Json?
  createdAt          DateTime @default(now())
}
```

`User` model gets two new back-relations: `resumes Resume[]` and `atsChecks ATSCheckAnalysis[]`.

`structuralFindings` shape (array), matching PRD §5.2 ("category, severity, explanation, fix guidance"):

```ts
type Finding = {
  category: string; // e.g. "multi-column-layout", "table-detected", "non-standard-font", "header-footer-content"
  severity: "critical" | "warning" | "suggestion";
  explanation: string;
  fixGuidance: string;
};
```

`overallScore`: starts at 100, `-15` per `critical` finding, `-5` per `warning` finding, floored at 0. `suggestion`-severity findings don't affect the score.

This sub-project requires real Supabase Postgres credentials in `.env` (`POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`) — the placeholder localhost values from Phase 1 won't work for actual persistence. `npx prisma migrate dev --name add_resume_ats_check` must run against the real database before this feature can be tested end-to-end.

## 4. Parsing and structural checks

**File acceptance**: `.pdf` and `.docx` only, max 5MB, MIME/magic-byte sniffed server-side (not just file extension) before parsing.

**PDF** (`pdfjs-dist`, used directly rather than the PRD's suggested `unpdf` — `unpdf` only exposes plain text, but detecting columns and fonts requires per-text-run position and font data from `getTextContent()`, which means dropping to `pdfjs-dist` itself):
- Multi-column layout: cluster the x-coordinates of text run start positions; two or more well-separated horizontal clusters across most of the page height is flagged `warning`
- Non-standard fonts: font name per text run checked against an allowlist (Arial, Helvetica, Calibri, Times New Roman, Georgia, Cambria, Garamond, Verdana + their common PDF-embedded variants); anything else flagged `suggestion`
- Table detection and header/footer detection are **not implemented for PDF in this sub-project** — PDF has no first-class header/footer/table concept, and reliable heuristics (repeated text in page margins across pages, grid-aligned text fragments) are meaningfully more complex than the two checks above. This is a documented limitation, not a silent gap — the results page notes it.

**DOCX** (`mammoth` for `rawText` extraction; `jszip` to open the `.docx` as a zip and inspect its XML parts directly, since `mammoth` doesn't expose structural XML):
- Table detection: `word/document.xml` contains a `<w:tbl>` element → `warning`
- Header/footer content: `word/header1.xml` / `word/footer1.xml` (if present in the zip) contain non-whitespace `<w:t>` text → `warning` (critical info like contact details in a header/footer is invisible to many ATS parsers)
- Non-standard fonts: `<w:rFonts>` references in `word/document.xml` checked against the same allowlist → `suggestion`

**Testable pure functions** (no DB/network access, unit-testable):
- `analyzePdfStructure(buffer: ArrayBuffer): Promise<Finding[]>`
- `analyzeDocxStructure(buffer: ArrayBuffer): Promise<Finding[]>`
- `extractPdfText(buffer: ArrayBuffer): Promise<string>`
- `extractDocxText(buffer: ArrayBuffer): Promise<string>`
- `scoreFindings(findings: Finding[]): number`

## 5. Pages and flow

- `/ats-check` — list of the user's past checks (simple table/list: filename, score, date, link to result) — empty state if none yet
- `/ats-check/new` — drag-and-drop upload zone (PDF/DOCX, 5MB limit stated in the UI), progressive loading state ("Membaca resume Anda...") while the Server Action runs
- `/ats-check/[id]` — `id` is the encrypted token; decrypt server-side, look up `ATSCheckAnalysis` scoped to `resumeId` + authenticated `userId` (never trust the token alone — still filter by session's `userId`), `notFound()` on decrypt failure or ownership mismatch. Shows: overall score (progress-ring style, consistent with the existing design system), findings grouped by severity, category, explanation, fix guidance per PRD §5.2. A visible note when PDF table/header-footer checks were skipped (per §4's documented limitation).
- Dashboard's "ATS Compatibility Check" module card stops being a disabled "coming soon" placeholder and links to `/ats-check`

All new pages follow the established design system (`docs/design-system.md`): hairline cards, Apple-blue accent only on buttons/links, no em dashes, bilingual via next-intl (new `ats` message namespace in `messages/id.json` / `messages/en.json`).

## 6. Error handling

- Wrong file type or over size limit: rejected client-side (immediate feedback) and re-validated server-side (never trust client-only validation, per project convention) — clear inline error, not a generic failure
- Parsing failure (corrupted/password-protected file): caught, user sees a plain-language error ("File tidak bisa dibaca, coba simpan ulang sebagai PDF dan unggah lagi") rather than a stack trace
- Decrypt failure / analysis not found / not owned by the current user on `/ats-check/[id]`: `notFound()` (Next.js 404), not an error page — avoids leaking whether an id exists

## 7. Testing

- Unit tests (Vitest) for `analyzePdfStructure`, `analyzeDocxStructure`, `scoreFindings`, `encryptId`/`decryptId` — fixture PDF/DOCX files (a clean single-column one, one with a table, one with an unusual font) checked into a `fixtures/` folder for the structural-check tests
- `encryptId`/`decryptId` round-trip test, plus a tampered-token-fails test
- Manual smoke test: upload a real resume PDF and DOCX through the UI, confirm findings are sensible, confirm the record persists and `/ats-check` lists it

## 8. Out of scope (explicit, restated)

- LLM keyword-relevance check
- Resume Optimizer
- History/Profile pages
- Supabase Storage
- PDF table/header-footer detection
