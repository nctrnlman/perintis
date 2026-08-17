# Design Spec — Perintis: Resume Builder

**Date**: 2026-08-17
**Status**: Approved for planning
**Source PRD**: `prd-perintis-by-devino-labs.md` §5.3 (`/builder` module)

## 1. Scope

A guided resume builder that lets a user generate one or more tailored, ATS-safe PDF resumes from their Profile data. Each generated resume is an independently editable snapshot — decoupled from Profile after creation — so a user can maintain separate resumes for different job applications (e.g. "Resume - Backend Engineer @ Startup X") without one affecting another, and without later Profile edits silently altering an already-downloaded resume.

The visual/structural reference is the user's own resume at `resume/Rhazes - ATS Resume.pdf`: single-column, no tables or graphics, black-and-white, standard underlined section headings, bold name and key metrics, right-aligned date ranges. The goal is to match or exceed its ATS-friendliness.

In scope:

- Prisma schema: `Profile.summary` field; three new Profile-linked models (`Certification`, `Project`, `Language`); a new `ResumeDocument` model holding a JSON content snapshot
- `/resume-builder` list page (create new, view history) and `/resume-builder/[id]` single-page builder (fully editable, all sections default-seeded from Profile at creation)
- AI-assisted bullet rewriting for Work Experience entries, using Gemini's free tier (`@google/genai`, model `gemini-2.5-flash`), with an explicit anti-fabrication guardrail
- One ATS-safe PDF template ("ATS Classic"), rendered via `@react-pdf/renderer`, served through an authenticated route handler; preview and download both hit the same endpoint so there is zero drift between what's previewed and what's downloaded
- The three new Profile sections (Summary, Certifications, Projects, Languages) also get their own cards on the existing `/profile` page, following the established `PersonalInfoCard`/`WorkExperienceCard` pattern, so they're maintainable as source-of-truth data independent of any specific resume

Out of scope for this sub-project (explicit):

- Multiple PDF templates / template picker — one template only ("ATS Classic")
- Drag-and-drop reordering of entries within a resume
- AI enhancement for Summary, Project, or Education bullets — Work Experience only
- Per-bullet accept/reject for AI suggestions — a full "Terapkan Semua / Batalkan" per work-experience entry instead
- Inline bold/rich-text formatting within bullets in the PDF (the reference resume bolds specific metrics manually; replicating that generically is a real scope increase, deferred)
- Resume Optimizer, Cover Letter, or any other module consuming this data — noted as future consumers of the same Profile fields, not built now

## 2. Data model

Add to `Profile`:

```prisma
model Profile {
  // ...existing fields unchanged...
  summary String?

  certifications Certification[]
  projects       Project[]
  languages      Language[]
}
```

Three new models, following the exact pattern of `WorkExperience`/`Education`/`Skill`:

```prisma
model Certification {
  id        String    @id @default(cuid())
  profileId String
  profile   Profile   @relation(fields: [profileId], references: [id])
  name      String
  issuer    String
  issueDate DateTime?
  url       String?
  createdAt DateTime  @default(now())
}

model Project {
  id         String   @id @default(cuid())
  profileId  String
  profile    Profile  @relation(fields: [profileId], references: [id])
  name       String
  client     String?
  role       String?
  bullets    String[]
  techStack  String[]
  createdAt  DateTime @default(now())
}

model Language {
  id          String  @id @default(cuid())
  profileId   String
  profile     Profile @relation(fields: [profileId], references: [id])
  name        String
  proficiency String
}
```

New model for generated resumes:

```prisma
model ResumeDocument {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  content   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

`User` gets a back-relation: `resumeDocuments ResumeDocument[]`.

### Content snapshot shape

`ResumeDocument.content` is a self-contained JSON document, typed in application code as:

```typescript
interface ResumeContent {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedinUrl: string;
    portfolioUrl: string;
  };
  summary: string;
  workExperiences: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    startDate: string | null; // "YYYY-MM-DD"
    endDate: string | null;
    bullets: string[];
  }>;
  educations: Array<{
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy: string;
    location: string;
    startDate: string | null;
    endDate: string | null;
    bullets: string[];
  }>;
  skills: Array<{ id: string; name: string; category: string }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issueDate: string | null;
    url: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    client: string;
    role: string;
    bullets: string[];
    techStack: string[];
  }>;
  languages: Array<{ id: string; name: string; proficiency: string }>;
}
```

Note that `educations` in the snapshot carries `location` and `bullets` even though the base `Education` Profile model has neither — the reference template shows both under each education entry. These fields simply default to empty when seeding from Profile, and the user fills them in per-resume if wanted. This is a deliberate asymmetry: the snapshot is free to be richer than its source, since it's decoupled after creation. The base `Education` model is not extended just for this — avoids adding fields to Profile that most users would leave blank most of the time.

Array entries get a client-generated `id` (`crypto.randomUUID()`) purely for React keys and in-snapshot targeting (add/edit/delete within the JSON array) — these ids have no relation to any Profile row's database id.

### Seeding logic

`buildContentFromProfile(profile): ResumeContent` — a pure function in `src/lib/resume-builder/build-content.ts`, given a `Profile` fetched with all relations included. Transforms:

- `workExperiences[].bullets` = `WorkExperience.description` split on newlines, trimmed, empty lines filtered out
- `projects[].bullets` = `Project.bullets` copied as-is (already an array in the source model)
- All dates formatted as `"YYYY-MM-DD"` strings (or `null`)
- `educations[].location` and `educations[].bullets` default to `""` / `[]` (not present in source `Education` model, per above)
- `personalInfo.email` comes from `User.email`, not `Profile`
- General rule for every other optional Prisma string/date field mapped into a non-nullable snapshot string field (e.g. `Certification.url`, `Project.client`, `Project.role`): `null` becomes `""`. Snapshot fields typed `string | null` in §2's interface (only the date fields) keep `null` as `null` — they are never coerced to an empty string, since the PDF template and date formatter both need to distinguish "no end date" from an actual empty string

## 3. Pages and flow

### `/resume-builder` (list page)

Mirrors `/ats-check`'s list page pattern exactly: full-row clickable list of the user's `ResumeDocument`s (title, last updated date), empty state, and a "Buat Resume Baru" button.

Creating a new resume: a Server Action `createResumeDocument()` calls `ensureProfileRecord` defensively, fetches the full `Profile` with all relations, runs `buildContentFromProfile`, creates a `ResumeDocument` row (`title` defaults to `"Resume Baru"`), and redirects to `/resume-builder/[encryptedId]` (using the existing `id-crypto` pattern).

### `/resume-builder/[id]` (builder page)

A single client-side page holding the entire `content` object in React state (initialized from the server-fetched `ResumeDocument`). One page, several section cards, all editable, matching the visual pattern of `/profile`'s cards but operating on slices of this one JSON object instead of separate Prisma rows:

1. **Resume title** — plain text input at the top, not part of `content`, saved as `ResumeDocument.title`
2. **Info Kontak** — editable fields (name, email, phone, location, LinkedIn, portfolio), defaulted from Profile/User at creation, freely editable per-resume from here on
3. **Summary** — textarea
4. **Work Experience** — list of entries, each with title/company/location/dates and an editable bullet list (add/remove/edit lines), plus an **"Enhance dengan AI"** button per entry
5. **Education** — list of entries (institution/degree/field/location/dates/bullets)
6. **Skills** — list of `{ name, category }` entries
7. **Certifications** — list of `{ name, issuer, issueDate, url }` entries
8. **Projects** — list of `{ name, client, role, bullets, techStack }` entries
9. **Languages** — list of `{ name, proficiency }` entries

Unlike `/profile`'s per-card Save buttons, this page has **one** "Simpan Perubahan" action for the whole document — deliberate deviation from the Profile pattern, because the underlying storage is one JSON blob rather than independent relational rows, so partial-save doesn't map cleanly to the data model. All edits live in local state until Save is clicked; Save calls `updateResumeContent(resumeDocumentId, content)`, which re-validates the whole `ResumeContent` shape via Zod and overwrites the `content` column.

Below the last card: **Preview** (opens `/resume-builder/[id]/pdf` in an embedded viewer / new tab) and **Download PDF** (`<a href="/resume-builder/[id]/pdf" download="{title}.pdf">`) — both hit the exact same route handler, so preview and downloaded file are always identical.

### AI Enhance flow

Button on each Work Experience entry calls Server Action `enhanceWorkExperienceBullets(title, company, bullets)` → returns `{ success: true, enhancedBullets: string[] } | { error: string }`. This action does not persist anything — it's a pure transform. The UI shows the suggestion inline below the entry's original bullets, with **"Terapkan Semua"** (replaces that entry's bullets in local state) and **"Batalkan"** (discards the suggestion). Applying still requires the page's overall Save to persist, same as any other edit.

## 4. AI integration (Gemini)

- Package: `@google/genai` (Google's current official unified GenAI SDK)
- Model: `gemini-2.5-flash` (free tier via Google AI Studio)
- **Hard constraint: free tier only.** No paid model, no paid API tier, and no automatic fallback to a paid model/provider if the free tier's rate limit is hit — a rate-limit or quota error is just another `{ error: "enhancement-failed" }` case (§8), surfaced as a toast asking the user to try again shortly. This must not be "upgraded" later without the user explicitly asking for it.
- New env var: `GEMINI_API_KEY` — will be requested from the user when this task is reached during implementation, added to `.env` (never committed, same handling as all other secrets this session)
- New file: `src/lib/resume-builder/enhance-bullets.ts`, exporting `enhanceBullets({ title, company, bullets }: { title: string; company: string; bullets: string[] }): Promise<string[]>`
- Prompt requirements (hard constraints, stated explicitly in the system/user prompt):
  - Rewrite the given bullets into polished, professional resume language
  - **Never invent** achievements, metrics, or numbers not present in the input — if the input has no quantification, do not add any
  - Return strictly as a JSON array of strings (parsed and validated on the server; if parsing fails, treat as an error, do not silently fall back to garbled text)
  - Preserve the same number of bullets as the input (one-to-one rewrite, not summarization or expansion)
- Server Action wraps the raw SDK call, catches and logs errors, returns `{ error: "enhancement-failed" }` on any failure (network, rate limit, malformed response) — never throws to the client

### Token efficiency (verified against `@google/genai` v2 docs)

The `generateContent` call sets three config options together to keep every request cheap, since this runs on a free tier with real rate limits:

- `thinkingConfig: { thinkingBudget: 0 }` — `gemini-2.5-flash` allocates extended "thinking" tokens by default; a bullet rewrite is not a reasoning task, so thinking is turned off entirely (unlike `gemini-2.5-pro`, `flash` supports a budget of exactly `0`)
- `responseMimeType: "application/json"` + `responseJsonSchema: { type: Type.ARRAY, items: { type: Type.STRING } }` — forces the model to answer with a bare JSON array of strings, no markdown fencing or conversational preamble, which both shortens the response and removes the need for fragile text-parsing
- `maxOutputTokens: 512` — hard cap; a handful of resume bullets never needs more, and this bounds the worst case if the model were to misbehave

## 5. PDF generation

- New file: `src/lib/resume-builder/pdf-template.tsx` — a `@react-pdf/renderer` `Document`/`Page` component tree, `ResumeContent` in, PDF out. Font: Helvetica (built into `@react-pdf/renderer`, no embedding needed, clean and ATS-conventional). Layout follows the reference structure section-by-section (§3 above), single column, underlined section headings, bold name/entry titles, right-aligned date ranges. No inline bold-within-bullet parsing in v1 (see Out of Scope).
- New route handler: `src/app/[locale]/(app)/resume-builder/[id]/pdf/route.ts` — `GET` handler that decrypts `id`, verifies the `ResumeDocument.userId` matches the authenticated user (`notFound()` on mismatch, same discipline as every other ownership check this session), renders via `renderToStream`, and returns a `Response` with `Content-Type: application/pdf`, `Content-Disposition: inline; filename="<title>.pdf"`.
- Shared date-formatting helper (`src/lib/resume-builder/format-date.ts`, e.g. `formatMonthYear(dateString: string | null): string`) used both by the on-screen edit forms and the PDF template — the only piece of rendering logic actually shared between the two surfaces, since it has no DOM/PDF-specific dependency.

## 6. Server Actions

All in `src/app/[locale]/(app)/resume-builder/actions.ts`, each verifying the `ResumeDocument` belongs to the authenticated user before reading/writing:

- `createResumeDocument()` — seeds from Profile, returns `{ token: string } | { error: string }` (encrypted id, same return shape as ATS Check's upload action)
- `updateResumeContent(id: string, title: string, content: ResumeContent)` — validates via Zod, overwrites `title` and `content`
- `deleteResumeDocument(id: string)` — for the list page
- `enhanceWorkExperienceBullets(title: string, company: string, bullets: string[])` — calls Gemini, does not touch the database

Cards on `/profile` for the three new sections get their own Server Actions in the existing `src/app/[locale]/(app)/profile/actions.ts`, following the exact pattern already established for Work Experience/Education/Skill: `addCertification`/`updateCertification`/`deleteCertification`, `addProject`/`updateProject`/`deleteProject`, `addLanguage`/`deleteLanguage` (Language, like Skill, is add/remove only — no in-place edit), plus `updateSummary` folded into the existing `updatePersonalInfo` action (adds a `summary` field to `personalInfoSchema`).

## 7. Validation

New Zod schemas in `src/lib/validations/profile.ts` (extending the existing file): `certificationSchema`, `projectSchema`, `languageSchema`; `personalInfoSchema` gets an added optional `summary` field.

New file `src/lib/validations/resume-content.ts`: a full `resumeContentSchema` (Zod object mirroring the `ResumeContent` interface in §2) used by `updateResumeContent` to validate the entire snapshot on every save — this is the single validation gate for all resume-builder edits, since everything funnels through one save action.

## 8. Error handling

- Every Server Action returns `{ error: string }` on failure (validation, ownership mismatch, AI failure) — pages show a toast with the translated message, same pattern as ATS Check and Profile
- AI enhancement failure: toast error, original bullets untouched, rest of the builder stays usable
- PDF route failure (ownership mismatch): `notFound()`, same as ATS Check's `[id]` page
- `updateResumeContent` validation failure: toast error, local (unsaved) state is preserved so the user doesn't lose their edits — they can fix and retry

## 9. Cross-cutting

- Bilingual via next-intl: new `resumeBuilder` namespace in `messages/id.json`/`messages/en.json`; `profile` namespace gets new keys for the three added cards
- Design system (`docs/design-system.md`) applies to the *product UI* (builder page, cards, buttons) — hairline cards, accent-only-on-buttons-and-links, no em dashes. The *generated PDF itself* is a different design surface with a different goal (ATS parseability over brand aesthetic) and intentionally does not follow the Apple-style system — it follows conventional, neutral resume typography instead, matching the reference document
- `id-crypto` for `/resume-builder/[id]` and its `/pdf` sub-route, same as every other `/module/[id]` URL in this project
- Toast notifications on every save/create/delete/enhance action

## 10. Testing

- Zod schema unit tests (Vitest) for the four new/extended schemas, plus `resumeContentSchema`, mirroring `src/lib/validations/auth.test.ts` and `profile.test.ts`
- Unit tests for `buildContentFromProfile` (pure function — easy to test with a synthetic Profile fixture, no database needed)
- Manual smoke test: create a resume, edit every section, use AI Enhance on a work experience entry, save, preview, download, open the downloaded PDF and confirm text is selectable (mirrors the empirical verification already done for `@react-pdf/renderer` during brainstorming — a throwaway spike confirmed the generated PDF's text survives a round-trip through this project's own `pdfjs-dist` parser)

## 11. Out of scope (explicit, restated)

- Multiple templates / template picker
- Drag-and-drop reordering
- AI enhancement outside Work Experience bullets
- Per-bullet (vs per-entry) accept/reject for AI suggestions
- Inline bold/rich-text formatting within PDF bullets
- Any other module (Resume Optimizer, Cover Letter) consuming this data
